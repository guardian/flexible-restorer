import fs from "fs";
import path from "path";
import { once } from "node:events";

const { startLocalStack, stopLocalStack } = require("../setup/stackContainers") as typeof import("../setup/stackContainers");

async function main() {
    const projectRoot = process.cwd();
    const mode = process.env.APP_MODE === "prod" ? "prod" : "dev";
    let stack: Awaited<ReturnType<typeof startLocalStack>> | undefined;

    // Create the mount target up front so Docker doesn't create it as root.
    fs.mkdirSync(path.join(projectRoot, "logs"), { recursive: true });
    const shutdown = new AbortController();
    const termination = once(shutdown.signal, "abort");
    const onSignal = () => shutdown.abort(new Error("Local stack interrupted"));

    process.once("SIGINT", onSignal);
    process.once("SIGTERM", onSignal);

    try {
        stack = await startLocalStack(projectRoot, {
            hostPort: 9000,
            // Surface the restorer's logs/application.log on the host.
            mountLogs: true,
            mode,
            signal: shutdown.signal,
        });

        console.log(`\nLocal stack (${mode} mode) started at ${stack.baseUrl}`);
        console.log(
            `Open ${stack.cookieUrl} in your host browser to set the auth cookie and load the app.`,
        );
        console.log("Press Ctrl+C to stop.");
        process.stdin.resume();
        await termination;
    } finally {
        process.off("SIGINT", onSignal);
        process.off("SIGTERM", onSignal);
        process.stdin.pause();
        await stopLocalStack(stack);
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
