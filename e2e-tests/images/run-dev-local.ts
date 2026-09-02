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

    try {
        stack = await startLocalStack(projectRoot, { hostPort: 9000 });

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
