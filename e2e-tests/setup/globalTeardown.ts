import path from "path";
import { stopLocalStack } from "./stackContainers";
import { clearSharedStackInfo } from "./sharedStack";
import { getOwnedStack } from "./ownedStack";

/**
 * Playwright global teardown: stop the local stack that global setup started for
 * this run (and clear its published details). If the run reused a stack started
 * elsewhere (via `npm run local:stack`), there is nothing owned here, so that
 * stack is left running.
 */
export default async function globalTeardown(): Promise<void> {
    const stack = getOwnedStack();
    if (!stack) {
        return;
    }

    const projectRoot = path.resolve(__dirname, "../..");
    console.log("[globalTeardown] Stopping the local stack started for this run...");
    clearSharedStackInfo(projectRoot);
    await stopLocalStack(stack);
}
