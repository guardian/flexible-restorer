import path from "path";
import { startLocalStack } from "./stackContainers";
import {
    isStackReachable,
    readSharedStackInfo,
    writeSharedStackInfo,
} from "./sharedStack";
import { setOwnedStack } from "./ownedStack";

/**
 * Playwright global setup: boot a SINGLE local stack for the whole test run and
 * publish its connection details, so every worker reuses that one stack instead
 * of each booting its own in parallel.
 *
 * Behaviour:
 *   - If a stack started via `npm run dev:local` is already running, reuse it
 *     and leave its lifecycle to that process (we do not stop it in teardown).
 *   - Otherwise, only start a stack here when `START_LOCAL_INFRA` is set (as
 *     `npm run test:ci` does). Without it, skip the run so `npm run test` does
 *     nothing when no local stack is available instead of booting one. A stack
 *     started here is recorded as "owned" so global teardown stops it, and its
 *     details are written to the shared metadata file the worker fixture reads.
 */
export default async function globalSetup(): Promise<void> {
    const projectRoot = path.resolve(__dirname, "../..");

    const existing = readSharedStackInfo(projectRoot);
    if (existing && (await isStackReachable(existing.baseUrl))) {
        console.log(
            `[globalSetup] Reusing already-running local stack at ${existing.baseUrl}`,
        );
        return;
    }

    const shouldStartInfra = process.env.START_LOCAL_INFRA === "true";
    if (!shouldStartInfra) {
        console.log(
            "[globalSetup] No local stack is running and START_LOCAL_INFRA is not set — skipping the test run.\n" +
                "  Start a stack with `npm run dev:local` first, or run `npm run test:ci` to boot one automatically.",
        );
        // Exit cleanly so `npm run test` succeeds without running any tests
        // (and without global teardown trying to stop a stack we never owned).
        process.exit(0);
    }

    console.log(
        "[globalSetup] Starting a single local stack for the whole test run...",
    );
    const stack = await startLocalStack(projectRoot);
    setOwnedStack(stack);
    writeSharedStackInfo(projectRoot, {
        baseUrl: stack.baseUrl,
        panDomainPrivateKey: stack.panDomainPrivateKey,
        mockApiUrl: stack.mockApiUrl,
    });
    console.log(`[globalSetup] Local stack ready at ${stack.baseUrl}`);
}
