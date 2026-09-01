import path from "path";
import { GenericContainer, Network, Wait } from "testcontainers";
import { generatePanDomainKeys } from "./panDomainKeys";

const MINIO_ROOT_USER = "minioadmin";
const MINIO_ROOT_PASSWORD = "minioadmin";

export type LocalStack = {
    baseUrl: string;
    cookieUrl: string;
    panDomainPrivateKey: string;
    /**
     * Base URL of the configurable mock flexible-content API, mapped to the
     * host. POST to `${mockApiUrl}/__admin/state` to change what restore
     * destination/restore calls return at runtime.
     */
    mockApiUrl: string;
    minioContainer: any;
    restorerContainer: any;
    mockContainer: any;
    nginxContainer: any;
    network: any;
};

// In local dev the restorer runs as the DEV identity, whose effective stage is
// CODE, so it resolves each stack's real per-stage flexible-content API host
// (see app/models/FlexibleStack.scala and app/config/AppConfig.scala). We
// register those exact hostnames as network aliases on the mock container, so
// the real hostnames resolve to the mock inside the Docker network — no
// config/URL override required.
const MOCK_API_PORT = 8080;
const MOCK_API_HOSTNAMES = [
    // primary stack (flexible)
    "flexible-api.CODE.flexible.gudiscovery",
    // secondary stack (flexible-secondary)
    "apiv2.CODE.flexible-secondary.gudiscovery",
    // local DEV stack ("Local Flexible Content")
    "flexible-api.DEV.flexible.gudiscovery",
];

/**
 * Build an image from a Dockerfile (relative to the repo-root build context).
 * `withBuildkit()` is required: the Dockerfiles rely on BuildKit features
 * (auto `TARGETARCH`, `# syntax=`, `RUN --mount=type=cache`) that the legacy
 * builder can't handle. `deleteOnExit` labels the image with the Testcontainers
 * session id so the Ryuk reaper removes it when the run ends.
 */
function buildImage(
    projectRoot: string,
    dockerfile: string,
    tag: string,
): Promise<GenericContainer> {
    return GenericContainer.fromDockerfile(projectRoot, dockerfile)
        .withBuildkit()
        .build(tag, {
            deleteOnExit: true,
        });
}

function createLogConsumer(prefix: string, streamLogs: boolean) {
    return (stream: any) => {
        if (!streamLogs) {
            // Discard container logs (default): they are only echoed to stdout
            // when the stack is run directly via `npm run dev:local`.
            return;
        }
        stream
            .on("data", (line: Buffer) => {
                process.stdout.write(`[${prefix}] ${line.toString()}`);
            })
            .on("err", (line: Buffer) => {
                process.stderr.write(`[${prefix}] ${line.toString()}`);
            });
    };
}

export async function startLocalStack(
    projectRoot: string,
    options: { hostPort?: number; streamLogs?: boolean } = {},
): Promise<LocalStack> {
    const { hostPort, streamLogs = false } = options;

    // In the Docker-in-Docker dev container the daemon runs inside this
    // container, so published ports are reachable on localhost. Testcontainers
    // otherwise resolves an unreachable bridge-gateway IP and fails to connect
    // to the Ryuk reaper ("Failed to connect to Reaper"). Pin the host unless a
    // caller/CI has set it explicitly.
    process.env.TESTCONTAINERS_HOST_OVERRIDE ??= "localhost";

    const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const minioImageTag = `flexible-restorer-minio-e2e:${runId}`;
    const restorerImageTag = `flexible-restorer-app-e2e:${runId}`;
    const mockImageTag = `flexible-restorer-mock-api-e2e:${runId}`;
    const nginxImageTag = `flexible-restorer-nginx-e2e:${runId}`;

    const network = await new Network().start();

    let minioContainer;
    let restorerContainer;
    let mockContainer;
    let nginxContainer;
    const panDomainKeys = generatePanDomainKeys();

    try {
        minioContainer = await (
            await buildImage(
                projectRoot,
                "e2e-tests/images/minio.Dockerfile",
                minioImageTag,
            )
        )
            .withNetwork(network)
            .withNetworkAliases(
                "minio",
                "permissions-cache.minio",
                "pan-domain-auth-settings.minio",
                "flexible-snapshotter-code.minio",
                "flexible-secondary-snapshotter-code.minio",
            )
            .withEnvironment({
                MINIO_ROOT_USER,
                MINIO_ROOT_PASSWORD,
                MINIO_DOMAIN: "minio",
                PAN_DOMAIN_PRIVATE_KEY: panDomainKeys.privateKeyBase64,
                PAN_DOMAIN_PUBLIC_KEY: panDomainKeys.publicKeyBase64,
                PAN_DOMAIN_BUCKET: "pan-domain-auth-settings",
                SNAPSHOT_BUCKET: "flexible-snapshotter-code",
                SECONDARY_SNAPSHOT_BUCKET:
                    "flexible-secondary-snapshotter-code",
                PERMISSIONS_BUCKET: "permissions-cache",
            })
            .withLogConsumer(createLogConsumer("minio", streamLogs))
            .withExposedPorts(9000, 9001)
            .withWaitStrategy(Wait.forLogMessage(/Ensured buckets exist:/, 1))
            .withStartupTimeout(2 * 60 * 1000)
            .start();

        mockContainer = await (
            await buildImage(
                projectRoot,
                "e2e-tests/images/mock-flexible-api.Dockerfile",
                mockImageTag,
            )
        )
            .withNetwork(network)
            .withNetworkAliases(...MOCK_API_HOSTNAMES)
            .withLogConsumer(createLogConsumer("mock-api", streamLogs))
            .withExposedPorts(MOCK_API_PORT)
            .withWaitStrategy(
                Wait.forHttp("/__admin/health", MOCK_API_PORT).forStatusCode(
                    200,
                ),
            )
            .withStartupTimeout(2 * 60 * 1000)
            .start();

        const mockApiUrl = `http://${mockContainer.getHost()}:${mockContainer.getMappedPort(MOCK_API_PORT)}`;

        restorerContainer = await (
            await buildImage(
                projectRoot,
                "e2e-tests/images/restorer.Dockerfile",
                restorerImageTag,
            )
        )
            .withNetwork(network)
            // nginx proxies to the restorer over the Docker network by this alias.
            .withNetworkAliases("restorer")
            // Mount the source from the host so code changes are watched and
            // picked up without rebuilding the image. Individual paths are
            // mounted (rather than all of /app) so the image's baked
            // node_modules, compiled target/, and built public/dist are
            // preserved: `sbt run` recompiles changed Scala on the next request
            // and webpack (run in watch mode by entrypoint.dev.sh) rebuilds the
            // frontend on change.
            .withBindMounts([
                {
                    source: path.join(projectRoot, "app"),
                    target: "/app/app",
                    mode: "ro",
                },
                {
                    source: path.join(projectRoot, "conf"),
                    target: "/app/conf",
                    mode: "ro",
                },
                {
                    source: path.join(projectRoot, "public/javascripts"),
                    target: "/app/public/javascripts",
                    mode: "ro",
                },
                {
                    source: path.join(projectRoot, "public/sass"),
                    target: "/app/public/sass",
                    mode: "ro",
                },
                {
                    source: path.join(projectRoot, "webpack.config.js"),
                    target: "/app/webpack.config.js",
                    mode: "ro",
                },
            ])
            .withEnvironment({
                AWS_ENDPOINT_URL_S3: "http://minio:9000",
                AWS_ACCESS_KEY_ID: MINIO_ROOT_USER,
                AWS_SECRET_ACCESS_KEY: MINIO_ROOT_PASSWORD,
                // Keep local mode enabled in case scripts are bypassed in future changes.
                LOCAL: "true",
                // Point the local DEV stack at the mock flexible-content API,
                // reachable inside the Docker network via its registered alias.
                LOCAL_FLEXIBLE_API_PREFIX: `http://flexible-api.DEV.flexible.gudiscovery:${MOCK_API_PORT}`,
            })
            .withLogConsumer(createLogConsumer("restorer", streamLogs))
            // Exposed on a dynamic host port for debugging; browsers reach the
            // app through the nginx container below, not this port directly.
            .withExposedPorts(9000)
            .withStartupTimeout(10 * 60 * 1000)
            .withWaitStrategy(Wait.forListeningPorts())
            .start();

        nginxContainer = await (
            await buildImage(
                projectRoot,
                "e2e-tests/images/nginx.Dockerfile",
                nginxImageTag,
            )
        )
            .withNetwork(network)
            .withLogConsumer(createLogConsumer("nginx", streamLogs))
            // In the e2e suite the port is mapped dynamically (undefined host)
            // so parallel runs never collide. For local dev we bind a fixed host
            // port so the devcontainer's forwarded port (see .devcontainer
            // forwardPorts) reaches it from the host machine.
            .withExposedPorts(
                hostPort ? { container: 80, host: hostPort } : 80,
            )
            .withStartupTimeout(2 * 60 * 1000)
            .withWaitStrategy(Wait.forListeningPorts())
            .start();

        const baseUrl = `http://${nginxContainer.getHost()}:${nginxContainer.getMappedPort(80)}`;

        return {
            baseUrl,
            // Visiting this endpoint sets the prebaked auth cookie then redirects
            // to the app, so no cookie needs to be injected into the browser.
            cookieUrl: `${baseUrl}/cookie`,
            panDomainPrivateKey: panDomainKeys.privateKeyPem,
            mockApiUrl,
            minioContainer,
            restorerContainer,
            mockContainer,
            nginxContainer,
            network,
        };
    } catch (error) {
        if (nginxContainer) {
            await nginxContainer.stop();
        }
        if (restorerContainer) {
            await restorerContainer.stop();
        }
        if (mockContainer) {
            await mockContainer.stop();
        }
        if (minioContainer) {
            await minioContainer.stop();
        }
        await network.stop();
        throw error;
    }
}

export async function stopLocalStack({
    nginxContainer,
    restorerContainer,
    mockContainer,
    minioContainer,
    network,
}: Partial<LocalStack> = {}): Promise<void> {
    // Stop containers concurrently; allSettled keeps teardown best-effort so one
    // failed stop can't skip the others or the network cleanup below.
    await Promise.allSettled(
        [nginxContainer, restorerContainer, mockContainer, minioContainer]
            .filter(Boolean)
            .map((container) => container.stop()),
    );

    // Removed only after its containers are gone — Docker refuses to remove a
    // network while containers are still attached.
    if (network) {
        await network.stop();
    }

    // Run-specific images and any networks leaked by abruptly-killed runs are
    // reclaimed by Testcontainers' Ryuk reaper (started automatically per
    // session), so no manual image/network cleanup is needed here.
}
