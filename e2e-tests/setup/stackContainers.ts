import path from "path";
import { GenericContainer, Network, Wait } from "testcontainers";
import { generatePanDomainKeys } from "./panDomainKeys";
import { seedS3 } from "./seedS3";

// LocalStack accepts any credentials by default (signature validation is off);
// the conventional dummy pair keeps the SDKs and awslocal happy.
const S3_ACCESS_KEY_ID = "test";
const S3_SECRET_ACCESS_KEY = "test";

// Stock LocalStack image; buckets/objects the app reads are seeded from the host
// after start, so no custom image build is needed.
const LOCALSTACK_IMAGE = "localstack/localstack:4";
// LocalStack serves every enabled service on this one port.
const LOCALSTACK_PORT = 4566;
// LocalStack only parses the bucket from the Host header when it contains `.s3.`,
// so the S3 endpoint host (and the per-bucket network aliases) must sit under an
// `s3.` domain for the app's virtual-hosted-style S3 requests (AWS SDK v2 default,
// see app/config/AWS.scala) to resolve to the right bucket.
const S3_ENDPOINT_HOST = "s3.localstack";

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
    s3Container: any;
    restorerContainer: any;
    mockContentAPIContainer: any;
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
    options: { hostPort?: number; streamLogs?: boolean; mountLogs?: boolean; mode?: "dev" | "prod" } = {},
): Promise<LocalStack> {
    const { hostPort, streamLogs = false, mountLogs = false, mode = "dev" } = options;

    // In the Docker-in-Docker dev container the daemon runs inside this
    // container, so published ports are reachable on localhost. Testcontainers
    // otherwise resolves an unreachable bridge-gateway IP and fails to connect
    // to the Ryuk reaper ("Failed to connect to Reaper"). Pin the host unless a
    // caller/CI has set it explicitly.
    process.env.TESTCONTAINERS_HOST_OVERRIDE ??= "localhost";

    const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const restorerImageTag = `flexible-restorer-app-e2e:${runId}`;
    const mockImageTag = `flexible-restorer-mock-api-e2e:${runId}`;
    const nginxImageTag = `flexible-restorer-nginx-e2e:${runId}`;

    const network = await new Network().start();

    let s3Container;
    let restorerContainer;
    let mockContentAPIContainer;
    let nginxContainer;
    const panDomainKeys = generatePanDomainKeys();

    try {
        s3Container = await new GenericContainer(LOCALSTACK_IMAGE)
            .withNetwork(network)
            // `s3.localstack` is the S3 endpoint host; the per-bucket subdomains
            // are what the app's virtual-hosted-style S3 requests resolve to, and
            // each embeds `.s3.` so LocalStack extracts the bucket name.
            .withNetworkAliases(
                S3_ENDPOINT_HOST,
                `permissions-cache.${S3_ENDPOINT_HOST}`,
                `pan-domain-auth-settings.${S3_ENDPOINT_HOST}`,
                `flexible-snapshotter-code.${S3_ENDPOINT_HOST}`,
                `flexible-secondary-snapshotter-code.${S3_ENDPOINT_HOST}`,
            )
            .withEnvironment({
                SERVICES: "s3",
                AWS_DEFAULT_REGION: "eu-west-1",
            })
            // Bind-mount the fixtures tree so awslocal can seed the snapshot
            // buckets recursively without baking fixtures into a custom image.
            .withBindMounts([
                {
                    source: path.join(projectRoot, "e2e-tests/fixtures"),
                    target: "/fixtures",
                    mode: "ro",
                },
            ])
            .withLogConsumer(createLogConsumer("localstack", streamLogs))
            .withExposedPorts(LOCALSTACK_PORT)
            .withWaitStrategy(Wait.forLogMessage(/Ready\./, 1))
            .withStartupTimeout(5 * 60 * 1000)
            .start();

        // Seed the S3 objects the app reads before starting the restorer.
        await seedS3(s3Container, projectRoot, panDomainKeys);

        mockContentAPIContainer = await (
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

        const mockApiUrl = `http://${mockContentAPIContainer.getHost()}:${mockContentAPIContainer.getMappedPort(MOCK_API_PORT)}`;

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
            // In prod mode the app is staged and run in Play Prod mode (assets
            // served from the packaged classpath with the immutable cache
            // header); dev mode uses `sbt run` with webpack watch. The source is
            // still bind-mounted below in both modes so the run reflects host code.
            .withCommand([
                mode === "prod"
                    ? "/app/entrypoint.prod.sh"
                    : "/app/entrypoint.dev.sh",
            ])
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
                // Only mounted for local dev (not the parallel e2e suite, whose
                // runs would otherwise all write to the same host log file).
                // Surfaces logback's logs/application.log on the host.
                ...(mountLogs
                    ? [
                          {
                              source: path.join(projectRoot, "logs"),
                              target: "/app/logs",
                              mode: "rw" as const,
                          },
                      ]
                    : []),
            ])
            .withEnvironment({
                AWS_ENDPOINT_URL_S3: `http://${S3_ENDPOINT_HOST}:${LOCALSTACK_PORT}`,
                AWS_ACCESS_KEY_ID: S3_ACCESS_KEY_ID,
                AWS_SECRET_ACCESS_KEY: S3_SECRET_ACCESS_KEY,
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
            // `sbt run` (Play dev mode) binds the port before compiling — it only
            // compiles the app on the first request. Waiting for a 200 from the
            // (unauthenticated) healthcheck forces that first compile now, so the
            // stack is genuinely ready before we publish/use it, rather than the
            // first real request paying the compile cost and timing out.
            .withWaitStrategy(
                Wait.forHttp("/management/healthcheck", 9000).forStatusCode(200),
            )
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
            s3Container,
            restorerContainer,
            mockContentAPIContainer,
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
        if (mockContentAPIContainer) {
            await mockContentAPIContainer.stop();
        }
        if (s3Container) {
            await s3Container.stop();
        }
        await network.stop();
        throw error;
    }
}

export async function stopLocalStack({
    nginxContainer,
    restorerContainer,
    mockContentAPIContainer,
    s3Container,
    network,
}: Partial<LocalStack> = {}): Promise<void> {
    // Stop containers concurrently; allSettled keeps teardown best-effort so one
    // failed stop can't skip the others or the network cleanup below.
    await Promise.allSettled(
        [nginxContainer, restorerContainer, mockContentAPIContainer, s3Container]
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
