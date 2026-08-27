import type { LocalStack } from "./stackContainers";

/**
 * Process-local handle to the stack that global setup started for this test run.
 *
 * Playwright runs `globalSetup` and `globalTeardown` in the same (main) process,
 * so this module-level singleton lets teardown find and stop the stack that
 * setup started. It is left `undefined` when a stack started elsewhere (via
 * `npm run dev:local`) is reused, so teardown knows not to touch it.
 */
let ownedStack: LocalStack | undefined;

export function setOwnedStack(stack: LocalStack | undefined): void {
    ownedStack = stack;
}

export function getOwnedStack(): LocalStack | undefined {
    return ownedStack;
}
