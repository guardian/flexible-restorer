import fs from "fs";
import path from "path";

const { startLocalStack, stopLocalStack } = require("../setup/stackContainers") as typeof import("../setup/stackContainers");
const {
    writeSharedStackInfo,
    clearSharedStackInfo,
} = require("../setup/sharedStack") as typeof import("../setup/sharedStack");

function waitForTerminationSignal(): Promise<void> {
    return new Promise((resolve) => {
        const resolveOnce = () => {
            process.off("SIGINT", resolveOnce);
            process.off("SIGTERM", resolveOnce);
            resolve();
        };

        process.once("SIGINT", resolveOnce);
        process.once("SIGTERM", resolveOnce);
    });
}

async function main() {
    const projectRoot = process.cwd();
    let stack: Awaited<ReturnType<typeof startLocalStack>> | undefined;

    // Create the mount target up front so Docker doesn't create it as root.
    fs.mkdirSync(path.join(projectRoot, "logs"), { recursive: true });

    try {
        stack = await startLocalStack(projectRoot, {
            hostPort: 9000,
            // Echo each container's logs to this terminal so `sbt run` output
            // (and the other services) is visible while developing locally.
            streamLogs: true,
            // Surface the restorer's logs/application.log on the host.
            mountLogs: true,
        });

        // Publish the running stack's details so `npm run test` reuses this
        // stack instead of booting its own (and skips the run when absent).
        writeSharedStackInfo(projectRoot, {
            baseUrl: stack.baseUrl,
            panDomainPrivateKey: stack.panDomainPrivateKey,
            mockApiUrl: stack.mockApiUrl,
        });

        console.log(`\nLocal stack started at ${stack.baseUrl}`);
        console.log(
            `Open ${stack.cookieUrl} in your host browser to set the auth cookie and load the app.`,
        );
        console.log("Press Ctrl+C to stop.");
        process.stdin.resume();
        await waitForTerminationSignal();
    } finally {
        process.stdin.pause();
        clearSharedStackInfo(projectRoot);
        await stopLocalStack(stack);
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
