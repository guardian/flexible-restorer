import { createStackDiagnostics } from "../setup/stackDiagnostics";
import { buildStackImages, LOCALSTACK_IMAGE, runCommand } from "../setup/stackImages";
import { settleAll } from "../setup/stackLifecycle";

async function main(): Promise<void> {
    const projectRoot = process.cwd();
    const diagnostics = createStackDiagnostics(projectRoot);

    try {
        await diagnostics.step("prebuild", () => settleAll([
            () => buildStackImages(projectRoot, diagnostics, true),
            () => runCommand("docker", ["pull", LOCALSTACK_IMAGE], projectRoot, diagnostics, "pull:localstack"),
        ]));
    } finally {
        diagnostics.flush();
        diagnostics.log(`Diagnostics retained: ${diagnostics.directory}`);
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});