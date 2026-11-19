import { spawn } from "node:child_process";
import path from "node:path";
import {
    GenericContainer,
    getContainerRuntimeClient,
    getReaper,
    LABEL_TESTCONTAINERS_SESSION_ID,
} from "testcontainers";
import type { StackDiagnostics } from "./stackDiagnostics";
import { settleAll } from "./stackLifecycle";

export const LOCALSTACK_IMAGE = "localstack/localstack:4";

export async function runCommand(
    executable: string,
    args: string[],
    { cwd, diagnostics, stepName }: {
        cwd: string;
        diagnostics: StackDiagnostics;
        stepName: string;
    },
): Promise<void> {
    await diagnostics.step(stepName, () => new Promise<void>((resolve, reject) => {
        const child = spawn(executable, args, {
            cwd,
            stdio: ["ignore", "pipe", "pipe"],
            timeout: 20 * 60 * 1000,
            killSignal: "SIGKILL",
        });
        const logName = stepName.replaceAll(":", "-");
        const logPath = path.resolve(diagnostics.directory, "builds", `${logName}.log`);
        diagnostics.capture("builds", logName, child.stdout);
        diagnostics.capture("builds", logName, child.stderr);
        child.once("error", reject);
        child.once("close", (code, signal) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`${stepName} exited with ${signal ?? code}; see ${logPath}`));
            }
        });
    }));
}

export async function buildStackImages(
    projectRoot: string,
    { diagnostics, prebuild = false }: {
        diagnostics: StackDiagnostics;
        prebuild?: boolean;
    },
) {
    const build = async ({ name, dockerfile, image, prebuiltImage }: {
        name: string;
        dockerfile: string;
        image: string;
        prebuiltImage?: string;
    }) => {
        if (!prebuild && prebuiltImage) {
            diagnostics.log(`build:${name} using prebuilt image ${prebuiltImage}`);
            return new GenericContainer(prebuiltImage);
        }

        const labels = prebuild ? [] : [
            "--label",
            `${LABEL_TESTCONTAINERS_SESSION_ID}=${(await getReaper(await getContainerRuntimeClient())).sessionId}`,
        ];
        const builder = prebuild && process.env.E2E_BUILD_CACHE === "gha" ? [
            "buildx", "build", "--load",
            "--cache-from", `type=gha,version=2,scope=e2e-${name}`,
            "--cache-to", `type=gha,version=2,scope=e2e-${name},mode=max`,
        ] : ["build"];
        const tag = `${image}:${prebuild ? "prebuild" : diagnostics.runId}`;

        await runCommand("docker", [
            ...builder, "--progress=plain", ...labels,
            "-f", `e2e-tests/images/${dockerfile}.Dockerfile`, "-t", tag, ".",
        ], {
            cwd: projectRoot,
            diagnostics,
            stepName: `build:${name}`,
        });

        return new GenericContainer(tag);
    };

    const [restorer, mockApi, nginx] = await settleAll([
        () => build({
            name: "restorer",
            dockerfile: "restorer",
            image: "flexible-restorer-app-e2e",
            prebuiltImage: process.env.E2E_RESTORER_IMAGE,
        }),
        () => build({
            name: "mock-api",
            dockerfile: "mock-flexible-api",
            image: "flexible-restorer-mock-api-e2e",
            prebuiltImage: process.env.E2E_MOCK_API_IMAGE,
        }),
        () => build({
            name: "nginx",
            dockerfile: "nginx",
            image: "flexible-restorer-nginx-e2e",
            prebuiltImage: process.env.E2E_NGINX_IMAGE,
        }),
    ]);

    return { restorer, mockApi, nginx };
}