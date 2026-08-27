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
 *   - If a stack started via `npm run local:stack` is already running, reuse it
 *     and leave its lifecycle to that process (we do not stop it in teardown).
 *   - Otherwise, start one stack here, record it as "owned" so global teardown
 *     stops it, and write its details to the shared metadata file the worker
 *     fixture reads.
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
