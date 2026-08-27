import path from "path";
import { test as base, createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { type LocalStack } from "./setup/stackContainers";
import { readSharedStackInfo } from "./setup/sharedStack";

type WorkerFixtures = {
    localStack: LocalStack;
};

/**
 * Custom test instance for the BDD steps.
 *
 * It exposes a worker-scoped `localStack` fixture that reuses the single local
 * stack started once for the whole run by global setup (see
 * `e2e-tests/setup/globalSetup.ts`) — or by `npm run local:stack` during
 * development. Every worker connects to that same stack via the shared metadata
 * file, so we never boot multiple stacks in parallel. Steps are responsible for
 * navigating to `localStack.baseUrl` and signing in. Import `Given / When / Then`
 * from this module so the generated tests pick up this fixture.
 */
export const test = base.extend<object, WorkerFixtures>({
    localStack: [
        async ({}, use) => {
            const projectRoot = path.resolve(__dirname, "..");

            // Global setup guarantees a single stack is running and has published
            // its connection details. Every worker reuses it — none boots its own.
            const sharedStack = readSharedStackInfo(projectRoot);
            if (!sharedStack) {
                throw new Error(
                    "No shared local stack found. It is normally started by global " +
                        "setup; if you are running Playwright directly, start one " +
                        "with `npm run local:stack` first.",
                );
            }

            await use({
                baseUrl: sharedStack.baseUrl,
                panDomainPrivateKey: sharedStack.panDomainPrivateKey,
                mockApiUrl: sharedStack.mockApiUrl,
                minioContainer: undefined,
                restorerContainer: undefined,
                mockContainer: undefined,
                network: undefined,
            });
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
