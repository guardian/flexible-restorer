export {};

const { chromium } = require("@playwright/test") as typeof import("@playwright/test");
const { createPanDomainCookie } = require("../../tests/e2e/panDomainCookie") as typeof import("../../tests/e2e/panDomainCookie");
const { startLocalStack, stopLocalStack } = require("../../tests/e2e/stackContainers") as typeof import("../../tests/e2e/stackContainers");
const fs = require("fs") as typeof import("fs");
const path = require("path") as typeof import("path");

type CliOptions = {
    keepOpen: boolean;
    headless: boolean;
    debugPort: number;
    sessionFile: string;
};

function parseArgs(args: string[]): CliOptions {
    const options: CliOptions = {
        keepOpen: true,
        headless: false,
        debugPort: 9222,
        sessionFile: path.join(process.cwd(), ".tmp", "local-stack-session.json"),
    };

    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];

        if (arg === "--no-keep-open") {
            options.keepOpen = false;
            continue;
        }

        if (arg === "--headless") {
            options.headless = true;
            continue;
        }

        if (arg === "--debug-port") {
            const value = args[i + 1];
            if (!value) {
                throw new Error("Missing value for --debug-port");
            }
            options.debugPort = Number(value);
            if (!Number.isInteger(options.debugPort) || options.debugPort <= 0) {
                throw new Error(`Invalid --debug-port value: ${value}`);
            }
            i += 1;
            continue;
        }

        if (arg === "--session-file") {
            const value = args[i + 1];
            if (!value) {
                throw new Error("Missing value for --session-file");
            }
            options.sessionFile = value;
            i += 1;
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    return options;
}

function writeSessionFile(
    sessionFile: string,
    data: {
        baseUrl: string;
        debugPort: number;
        debuggerAddress: string;
        panDomainPrivateKey: string;
        panDomainCookie: string;
    },
) {
    fs.mkdirSync(path.dirname(sessionFile), { recursive: true });
    fs.writeFileSync(sessionFile, JSON.stringify(data, null, 2));
}

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
    const options = parseArgs(process.argv.slice(2));
    const projectRoot = process.cwd();
    let stack: Awaited<ReturnType<typeof startLocalStack>> | undefined;
    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

    try {
        stack = await startLocalStack(projectRoot);
        const cookieData = createPanDomainCookie(stack.panDomainPrivateKey);

        browser = await chromium.launch({
            headless: options.headless,
            args: [`--remote-debugging-port=${options.debugPort}`],
        });
        const page = await browser.newPage();
        await page.context().addCookies([
            {
                name: "gutoolsAuth-assym",
                value: cookieData,
                url: stack.baseUrl,
            },
        ]);
        await page.goto(stack.baseUrl, { waitUntil: "domcontentloaded" });

        const debuggerAddress = `127.0.0.1:${options.debugPort}`;
        writeSessionFile(options.sessionFile, {
            baseUrl: stack.baseUrl,
            debugPort: options.debugPort,
            debuggerAddress,
            panDomainPrivateKey: stack.panDomainPrivateKey,
            panDomainCookie: cookieData,
        });

        console.log(`\nLocal stack started at ${stack.baseUrl}`);
        console.log("Opened a browser with a local auth cookie.");
        console.log(`WebDriver debugger address: ${debuggerAddress}`);
        console.log(`Session metadata file: ${options.sessionFile}`);

        if (options.keepOpen) {
            console.log("Press Ctrl+C to stop.");
            process.stdin.resume();
            await waitForTerminationSignal();
        }
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
