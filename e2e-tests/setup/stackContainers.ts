import path from "path";
import { GenericContainer, Network, Wait } from "testcontainers";
import { generatePanDomainKeys } from "./panDomainKeys";

const MINIO_ROOT_USER = "minioadmin";
const MINIO_ROOT_PASSWORD = "minioadmin";

export type LocalStack = {
    baseUrl: string;
    cookieUrl: string;
    panDomainPrivateKey: string;
    minioContainer: any;
    restorerContainer: any;
    nginxContainer: any;
    network: any;
};

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

function createLogConsumer(prefix: string) {
    return (stream: any) => {
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
    options: { hostPort?: number } = {},
): Promise<LocalStack> {
    const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const minioImageTag = `flexible-restorer-minio-e2e:${runId}`;
    const restorerImageTag = `flexible-restorer-app-e2e:${runId}`;
    const nginxImageTag = `flexible-restorer-nginx-e2e:${runId}`;

    const network = await new Network().start();

    let minioContainer;
    let restorerContainer;
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
            .withLogConsumer(createLogConsumer("minio"))
            .withExposedPorts(9000, 9001)
            .withWaitStrategy(Wait.forLogMessage(/Ensured buckets exist:/, 1))
            .withStartupTimeout(2 * 60 * 1000)
            .start();

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
            })
            .withLogConsumer(createLogConsumer("restorer"))
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
            .withLogConsumer(createLogConsumer("nginx"))
            // In the e2e suite the port is mapped dynamically (undefined host)
            // so parallel runs never collide. For local dev we bind a fixed host
            // port so the devcontainer's forwarded port (see .devcontainer
            // forwardPorts) reaches it from the host machine.
            .withExposedPorts(
                options.hostPort
                    ? { container: 80, host: options.hostPort }
                    : 80,
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
            minioContainer,
            restorerContainer,
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
    minioContainer,
    network,
}: Partial<LocalStack> = {}): Promise<void> {
    // Stop containers concurrently; allSettled keeps teardown best-effort so one
    // failed stop can't skip the others or the network cleanup below.
    await Promise.allSettled(
        [nginxContainer, restorerContainer, minioContainer]
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
