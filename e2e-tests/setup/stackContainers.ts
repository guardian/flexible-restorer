import path from "path";
import { spawn } from "child_process";
import { GenericContainer, Network, Wait } from "testcontainers";
import { generatePanDomainKeys } from "./panDomainKeys";

const MINIO_ROOT_USER = "minioadmin";
const MINIO_ROOT_PASSWORD = "minioadmin";

type BuildDockerImageArgs = {
    tag: string;
    dockerfilePath: string;
    contextPath: string;
};

export type LocalStack = {
    baseUrl: string;
    panDomainPrivateKey: string;
    minioContainer: any;
    restorerContainer: any;
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
 * Remove orphaned Docker networks left behind by Testcontainers. Each stack run
 * creates a fresh network (with its own subnet); if a run is killed abruptly
 * instead of exiting cleanly, that network leaks. Enough leaked networks
 * exhaust Docker's predefined address pools and every subsequent run fails with
 * "all predefined address pools have been fully subnetted".
 *
 * `docker network prune` only removes networks that are not currently in use,
 * and the label filter scopes it to Testcontainers-created networks, so this
 * never touches the running stack or any unrelated user networks.
 */
function pruneOrphanedTestcontainerNetworks(): Promise<void> {
    return new Promise((resolve) => {
        const child = spawn(
            "docker",
            [
                "network",
                "prune",
                "--force",
                "--filter",
                "label=org.testcontainers=true",
            ],
            { stdio: "ignore" },
        );

        // Never let cleanup failures (e.g. docker not on PATH) break teardown.
        child.on("error", () => resolve());
        child.on("close", () => resolve());
    });
}

function buildDockerImage({
    tag,
    dockerfilePath,
    contextPath,
}: BuildDockerImageArgs): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log(`\n[docker-build] Building ${tag} from ${dockerfilePath}`);
        const child = spawn(
            "docker",
            [
                "build",
                "--progress=plain",
                "-t",
                tag,
                "-f",
                dockerfilePath,
                contextPath,
            ],
            { stdio: "inherit" },
        );

        child.on("error", reject);
        child.on("close", (code) => {
            if (code === 0) {
                console.log(`[docker-build] Finished ${tag}`);
                resolve();
            } else {
                reject(
                    new Error(
                        `docker build failed for ${tag} with exit code ${code}`,
                    ),
                );
            }
        });
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
): Promise<LocalStack> {
    const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const minioImageTag = `flexible-restorer-minio-e2e:${runId}`;
    const restorerImageTag = `flexible-restorer-app-e2e:${runId}`;

    const network = await new Network().start();

    let minioContainer;
    let restorerContainer;
    const panDomainKeys = generatePanDomainKeys();

    try {
        await buildDockerImage({
            tag: minioImageTag,
            dockerfilePath: path.join(
                projectRoot,
                "e2e-tests/images/minio.Dockerfile",
            ),
            contextPath: projectRoot,
        });

        minioContainer = await new GenericContainer(minioImageTag)
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

        await buildDockerImage({
            tag: restorerImageTag,
            dockerfilePath: path.join(
                projectRoot,
                "e2e-tests/images/restorer.Dockerfile",
            ),
            contextPath: projectRoot,
        });

        restorerContainer = await new GenericContainer(restorerImageTag)
            .withNetwork(network)
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
            .withExposedPorts(9000)
            .withStartupTimeout(10 * 60 * 1000)
            .withWaitStrategy(Wait.forListeningPorts())
            .start();

        const baseUrl = `http://${restorerContainer.getHost()}:${restorerContainer.getMappedPort(9000)}`;

        return {
            baseUrl,
            panDomainPrivateKey: panDomainKeys.privateKeyPem,
            minioContainer,
            restorerContainer,
            network,
        };
    } catch (error) {
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
    restorerContainer,
    minioContainer,
    network,
}: Partial<LocalStack> = {}): Promise<void> {
    if (restorerContainer) {
        await restorerContainer.stop();
    }
    if (minioContainer) {
        await minioContainer.stop();
    }
    if (network) {
        await network.stop();
    }

    // Also sweep up any networks leaked by previous runs that were killed before
    // they could tear down, so the address pool cannot slowly fill up over time.
    await pruneOrphanedTestcontainerNetworks();
}
