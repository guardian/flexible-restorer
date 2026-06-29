import path from "path";
import { test as base, createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import {
    startLocalStack,
    stopLocalStack,
    type LocalStack,
} from "./stackContainers";
import { isStackReachable, readSharedStackInfo } from "./sharedStack";

type WorkerFixtures = {
    localStack: LocalStack;
};

/**
 * Custom test instance for the BDD steps.
 *
 * It exposes a worker-scoped `localStack` fixture that boots the local MinIO +
 * Restorer stack (via Testcontainers). The fixture is lazy: it only boots when a
 * step actually destructures `localStack`, so pending/skipped scenarios never
 * start Docker. Steps are responsible for navigating to `localStack.baseUrl` and
 * signing in. Import `Given / When / Then` from this module so the generated
 * tests pick up this fixture.
 */
export const test = base.extend<object, WorkerFixtures>({
    // Boot the stack once per worker — building the Docker images is expensive,
    // so we share a single stack across all scenarios run in a worker.
    localStack: [
        async ({}, use) => {
            const projectRoot = path.resolve(__dirname, "../..");

            // If a stack started via `npm run local:stack` is already running,
            // reuse it instead of booting fresh containers. This makes the inner
            // dev loop much faster when iterating on tests.
            const sharedStack = readSharedStackInfo(projectRoot);
            if (sharedStack && (await isStackReachable(sharedStack.baseUrl))) {
                console.log(
                    `[localStack] Reusing running local stack at ${sharedStack.baseUrl}`,
                );
                await use({
                    baseUrl: sharedStack.baseUrl,
                    panDomainPrivateKey: sharedStack.panDomainPrivateKey,
                    mockApiUrl: sharedStack.mockApiUrl,
                    minioContainer: undefined,
                    restorerContainer: undefined,
                    mockContainer: undefined,
                    network: undefined,
                });
                return;
            }

            let stack: LocalStack | undefined;
            try {
                stack = await startLocalStack(projectRoot);
                await use(stack);
            } finally {
                await stopLocalStack(stack);
            }
        },
        { scope: "worker", timeout: 12 * 60 * 1000 },
    ],
});

export const { Given, When, Then, Before, After, BeforeStep, AfterStep } =
    createBdd(test);

// Optional pause after every step so you can watch scenarios play out in a
// headed browser. Enable with e.g. `STEP_DELAY=1000` (milliseconds).
const stepDelayMs = Number(process.env.STEP_DELAY ?? 0);
if (stepDelayMs > 0) {
    AfterStep(async () => {
        await new Promise((resolve) => setTimeout(resolve, stepDelayMs));
    });
}

export { expect };
