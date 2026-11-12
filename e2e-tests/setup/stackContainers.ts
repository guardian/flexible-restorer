import path from "path";
import { inspect } from "node:util";
import { GenericContainer, Network, Wait, type StartedNetwork, type StartedTestContainer } from "testcontainers";
import { generatePanDomainKeys } from "./panDomainKeys";
import { seedS3 } from "./seedS3";
import { createStackDiagnostics, type StackDiagnostics } from "./stackDiagnostics";
import { buildStackImages, LOCALSTACK_IMAGE } from "./stackImages";
import { settleAll, createStackResources, type StackResources } from "./stackLifecycle";
import { clearSharedStackInfo, writeSharedStackInfo } from "./sharedStack";

// LocalStack accepts any credentials by default (signature validation is off);
// the conventional dummy pair keeps the SDKs and awslocal happy.
const S3_ACCESS_KEY_ID = "test";
const S3_SECRET_ACCESS_KEY = "test";

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
    s3Container: StartedTestContainer;
    restorerContainer: StartedTestContainer;
    mockContentAPIContainer: StartedTestContainer;
    nginxContainer: StartedTestContainer;
    network: StartedNetwork;
    resources: StackResources;
    diagnostics: StackDiagnostics;
    projectRoot: string;
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

export async function startLocalStack(
    projectRoot: string,
    options: { hostPort?: number; mountLogs?: boolean; mode?: "dev" | "prod"; diagnostics?: StackDiagnostics; signal?: AbortSignal } = {},
): Promise<LocalStack> {
    const { hostPort, mountLogs = false, mode = "dev" } = options;
    const diagnostics = options.diagnostics ?? createStackDiagnostics(projectRoot);
    const resources = createStackResources(diagnostics);

    // In the Docker-in-Docker dev container the daemon runs inside this
    // container, so published ports are reachable on localhost. Testcontainers
    // otherwise resolves an unreachable bridge-gateway IP and fails to connect
    // to the Ryuk reaper ("Failed to connect to Reaper"). Pin the host unless a
    // caller/CI has set it explicitly.
    process.env.TESTCONTAINERS_HOST_OVERRIDE ??= "localhost";

    try {
        options.signal?.throwIfAborted();
        const panDomainKeys = generatePanDomainKeys();
        const network = await resources.startNetwork(() => new Network().start());
        const [images, s3Container] = await settleAll([
            () => buildStackImages(projectRoot, diagnostics),
            async () => {
                const s3Container = await resources.startContainer("localstack", () => new GenericContainer(LOCALSTACK_IMAGE)
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
                    .withLogConsumer((stream) => diagnostics.capture("containers", "localstack", stream))
                    .withExposedPorts(LOCALSTACK_PORT)
                    .withWaitStrategy(Wait.forSuccessfulCommand("awslocal s3api list-buckets"))
                    .withStartupTimeout(5 * 60 * 1000)
                    .start());
                await diagnostics.step("seed:s3", () => seedS3(s3Container, projectRoot, panDomainKeys));
                return s3Container;
            },
        ]);

        options.signal?.throwIfAborted();
        const [mockContentAPIContainer, restorerContainer] = await settleAll([
            () => resources.startContainer("mock-api", () => images.mockApi
                .withNetwork(network)
                .withNetworkAliases(...MOCK_API_HOSTNAMES)
                .withLogConsumer((stream) => diagnostics.capture("containers", "mock-api", stream))
                .withExposedPorts(MOCK_API_PORT)
                .withWaitStrategy(
                    Wait.forHttp("/__admin/health", MOCK_API_PORT).forStatusCode(
                        200,
                    ),
                )
                .withStartupTimeout(2 * 60 * 1000)
                .start()),
            () => resources.startContainer("restorer", () => images.restorer
                .withNetwork(network)
                // nginx proxies to the restorer over the Docker network by this alias.
                .withNetworkAliases("restorer")
                // In prod mode the app is staged and run in Play Prod mode (assets
                // served from the packaged classpath with the immutable cache
                // header); dev mode uses `sbt run` with the Vite dev server. The source is
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
                // and the Vite dev server (started by entrypoint.dev.sh) serves the
                // frontend with HMR.
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
                        source: path.join(projectRoot, "public/src"),
                        target: "/app/public/src",
                        mode: "ro",
                    },
                    {
                        source: path.join(projectRoot, "public/sass"),
                        target: "/app/public/sass",
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
                .withLogConsumer((stream) => diagnostics.capture("containers", "restorer", stream))
                // Exposed on dynamic host ports for debugging; browsers reach the app
                // (and the Vite dev server on 5173) through the nginx container below,
                // not these ports directly.
                .withExposedPorts(9000, 5173)
                .withStartupTimeout(10 * 60 * 1000)
                // `sbt run` (Play dev mode) binds the port before compiling — it only
                // compiles the app on the first request. Waiting for a 200 from the
                // (unauthenticated) healthcheck forces that first compile now, so the
                // stack is genuinely ready before we publish/use it, rather than the
                // first real request paying the compile cost and timing out.
                .withWaitStrategy(
                    Wait.forHttp("/management/healthcheck", 9000).forStatusCode(200),
                )
                .start()),
        ]);

        const mockApiUrl = `http://${mockContentAPIContainer.getHost()}:${mockContentAPIContainer.getMappedPort(MOCK_API_PORT)}`;
        options.signal?.throwIfAborted();
        const nginxContainer = await resources.startContainer("nginx", () => images.nginx
            .withNetwork(network)
            .withLogConsumer((stream) => diagnostics.capture("containers", "nginx", stream))
            // In the e2e suite the port is mapped dynamically (undefined host)
            // so parallel runs never collide. For local dev we bind a fixed host
            // port so the devcontainer's forwarded port (see .devcontainer
            // forwardPorts) reaches it from the host machine.
            .withExposedPorts(
                hostPort ? { container: 80, host: hostPort } : 80,
            )
            .withStartupTimeout(2 * 60 * 1000)
            .withWaitStrategy(Wait.forHttp("/management/healthcheck", 80).forStatusCode(200))
            .start());

        const baseUrl = `http://${nginxContainer.getHost()}:${nginxContainer.getMappedPort(80)}`;
        await diagnostics.step("check:cookie", async () => {
            const response = await fetch(`${baseUrl}/cookie`, {
                redirect: "manual",
                signal: AbortSignal.timeout(10_000),
            });
            await response.body?.cancel();
            if (response.status !== 302 || !response.headers.get("set-cookie")?.includes("gutoolsAuth-assym=")) {
                throw new Error("Proxy cookie endpoint did not set an authentication cookie and redirect");
            }
        });
        options.signal?.throwIfAborted();
        await diagnostics.step("publish:stack", async () => writeSharedStackInfo(projectRoot, {
            baseUrl,
            panDomainPrivateKey: panDomainKeys.privateKeyPem,
            mockApiUrl,
            runId: diagnostics.runId,
        }));
        diagnostics.log(`Stack ready at ${baseUrl}`);

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
            resources,
            diagnostics,
            projectRoot,
        };
    } catch (error) {
        diagnostics.log(`Startup failed: ${inspect(error, { depth: 5 })}`);
        await cleanupLocalStack(projectRoot, resources, diagnostics);
        throw error;
    }
}

async function cleanupLocalStack(
    projectRoot: string,
    resources: StackResources,
    diagnostics: StackDiagnostics,
): Promise<void> {
    try {
        await resources.stopAll();
    } finally {
        await diagnostics.step("remove:metadata", async () => {
            clearSharedStackInfo(projectRoot, diagnostics.runId);
        }).catch(() => { });
        diagnostics.flush();
        diagnostics.log(`Diagnostics retained: ${diagnostics.directory}`);
    }
}

export async function stopLocalStack(stack?: LocalStack): Promise<void> {
    if (stack) {
        await cleanupLocalStack(stack.projectRoot, stack.resources, stack.diagnostics);
    }
}
