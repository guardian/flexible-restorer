const { chromium } = require("@playwright/test") as typeof import("@playwright/test");
const { createPanDomainCookie } = require("../../tests/e2e/panDomainCookie") as typeof import("../../tests/e2e/panDomainCookie");
const { startLocalStack, stopLocalStack } = require("../../tests/e2e/stackContainers") as typeof import("../../tests/e2e/stackContainers");

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
    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

    try {
        stack = await startLocalStack(projectRoot);
        const cookieData = createPanDomainCookie(stack.panDomainPrivateKey);

        browser = await chromium.launch({ headless: false });
        const page = await browser.newPage();
        await page.context().addCookies([
            {
                name: "gutoolsAuth-assym",
                value: cookieData,
                url: stack.baseUrl,
            },
        ]);
        await page.goto(stack.baseUrl, { waitUntil: "domcontentloaded" });

        console.log(`\nLocal stack started at ${stack.baseUrl}`);
        console.log("Opened a browser with a local auth cookie.");
        console.log("Press Ctrl+C to stop.");
        process.stdin.resume();
        await waitForTerminationSignal();
    } finally {
        if (browser) {
            await browser.close();
        }
        process.stdin.pause();
        await stopLocalStack(stack);
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
