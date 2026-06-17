const path = require("path");
const { spawn } = require("child_process");
const { GenericContainer, Network, Wait } = require("testcontainers");

const MINIO_ROOT_USER = "minioadmin";
const MINIO_ROOT_PASSWORD = "minioadmin";

function buildDockerImage({ tag, dockerfilePath, contextPath }) {
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

function createLogConsumer(prefix) {
    return (stream) => {
        stream
            .on("data", (line) => {
                process.stdout.write(`[${prefix}] ${line.toString()}`);
            })
            .on("err", (line) => {
                process.stderr.write(`[${prefix}] ${line.toString()}`);
            });
    };
}

async function startLocalStack(projectRoot) {
    const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const minioImageTag = `flexible-restorer-minio-e2e:${runId}`;
    const restorerImageTag = `flexible-restorer-app-e2e:${runId}`;

    const network = await new Network().start();

    let minioContainer;
    let restorerContainer;

    try {
        await buildDockerImage({
            tag: minioImageTag,
            dockerfilePath: path.join(projectRoot, "images/minio.Dockerfile"),
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
                PAN_DOMAIN_BUCKET: "pan-domain-auth-settings",
                SNAPSHOT_BUCKET: "flexible-snapshotter-code",
                SECONDARY_SNAPSHOT_BUCKET:
                    "flexible-secondary-snapshotter-code",
                PERMISSIONS_BUCKET: "permissions-cache",
            })
            .withLogConsumer(createLogConsumer("minio"))
            .withExposedPorts(9000, 9001)
            .withWaitStrategy(Wait.forListeningPorts())
            .start();

        await buildDockerImage({
            tag: restorerImageTag,
            dockerfilePath: path.join(
                projectRoot,
                "images/restorer.Dockerfile",
            ),
            contextPath: projectRoot,
        });

        restorerContainer = await new GenericContainer(restorerImageTag)
            .withNetwork(network)
            .withEnvironment({
                AWS_ENDPOINT_URL_S3: "http://minio:9000",
                S3_PATH_STYLE_ACCESS: "true",
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

async function stopLocalStack({ restorerContainer, minioContainer, network }) {
    if (restorerContainer) {
        await restorerContainer.stop();
    }
    if (minioContainer) {
        await minioContainer.stop();
    }
    if (network) {
        await network.stop();
    }
}

module.exports = {
    startLocalStack,
    stopLocalStack,
};
