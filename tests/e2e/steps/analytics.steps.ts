import { Before, Given, When, Then } from "../fixtures";

/**
 * Playwright-style step definitions for `tests/features/analytics.feature`.
 *
 * These are stubs only — no implementations yet. Each step receives the
 * Playwright fixtures as the first argument (e.g. `async ({ page }) => { ... }`)
 * following the playwright-style approach:
 * https://vitalets.github.io/playwright-bdd/#/writing-steps/playwright-style
 *
 * The custom fixtures in `../fixtures` boot (or reuse) the local stack and
 * provide a signed-in `page` for the steps to use.
 *
 * NOTE: Steps that already exist in other step files are intentionally NOT
 * redefined here, because playwright-bdd shares step definitions across all
 * step files. The following are reused from elsewhere:
 *   - `the application stack is running` / `I am signed in through pan-domain auth`
 *     (content-search.steps.ts)
 *   - `snapshot content has loaded` / `the restore modal is open`
 *     (content-snapshot-content.steps.ts)
 */

// The steps are not implemented yet, so mark every scenario in this feature as
// pending (skipped). This runs before any step, so the local stack is never
// booted for these scenarios. Remove this hook once the steps are implemented.
Before({ tags: "@pending" }, async ({ $test }) => {
    $test.skip(true, "analytics steps are not implemented yet");
});

// --- The analytics service chooses the correct telemetry client ---------------

Given("the application has bootstrapped the analytics service", async () => {
    // TODO: implement step
});

When(/^the app is running on (.+)$/, async ({ page: _page }, _host: string) => {
    // TODO: implement step
});

Then(
    /^analytics requests should be sent to (.+)$/,
    async ({ page: _page }, _telemetryClient: string) => {
        // TODO: implement step
    },
);

// --- A route change sends a tracking pixel for the current page path ----------

Given("the analytics service is active", async () => {
    // TODO: implement step
});

When("I navigate to a new page in the application", async () => {
    // TODO: implement step
});

Then("a tracking pixel should be requested", async () => {
    // TODO: implement step
});

Then("the request should include app=restorer", async () => {
    // TODO: implement step
});

Then("the request should include the current route path", async () => {
    // TODO: implement step
});

// --- Loading the app boots analytics tracking automatically -------------------

Given("the application has started", async () => {
    // TODO: implement step
});

When("the restorer application run block executes", async () => {
    // TODO: implement step
});

Then(
    "analytics tracking should be available without extra user action",
    async () => {
        // TODO: implement step
    },
);

Then("subsequent route changes should be tracked", async () => {
    // TODO: implement step
});

// --- Viewing a snapshot emits a viewed analytics event ------------------------

Given("version history data has loaded successfully", async () => {
    // TODO: implement step
});

When("the first snapshot content is loaded", async () => {
    // TODO: implement step
});

Then("a Snapshot Viewed event should be published", async () => {
    // TODO: implement step
});

Then(
    "the event should include the content id and snapshot timestamp",
    async () => {
        // TODO: implement step
    },
);

// --- Changing the active snapshot emits an active analytics event -------------

When("I move to a different snapshot in the list", async () => {
    // TODO: implement step
});

Then("a Snapshot Active event should be published", async () => {
    // TODO: implement step
});

// --- Copying snapshot content emits a copied analytics event ------------------

When("I copy the snapshot JSON", async () => {
    // TODO: implement step
});

Then("a Snapshot Copied event should be published", async () => {
    // TODO: implement step
});

// --- Restoring a snapshot emits a restored analytics event --------------------

When("I submit a successful restore", async () => {
    // TODO: implement step
});

Then("a Snapshot Restored event should be published", async () => {
    // TODO: implement step
});
