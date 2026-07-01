const { startLocalStack, stopLocalStack } =
    require("../setup/stackContainers") as typeof import("../setup/stackContainers");

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

        console.log(`\nLocal stack started at ${stack.baseUrl}`);
        console.log(
            `Open ${stack.cookieUrl} in your host browser to set the auth cookie and load the app.`,
        );
        console.log("Press Ctrl+C to stop.");

        // When PICK_LOCATOR is set, open the Playwright Inspector against this
        // already-authenticated page. Use its "Pick locator" tool to grab
        // selectors without re-doing auth. Click "Resume" in the Inspector to
        // return here; the stack and browser stay up until you press Ctrl+C.
        if (process.env.PICK_LOCATOR) {
            console.log(
                "PICK_LOCATOR set: opening Playwright Inspector. " +
                    'Use "Pick locator", then click "Resume" when done.',
            );
            await page.pause();
        }

        process.stdin.resume();
        await waitForTerminationSignal();
    } finally {
        process.stdin.pause();
        await stopLocalStack(stack);
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
