import type { Request } from "@playwright/test";
import { Before, Given, When, Then, expect } from "../fixtures";

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

const timeout = 10 * 1000;

// The outbound tracking-pixel request the AnalyticsService issues (via
// `new Image()`) on `$routeChangeSuccess`. The navigation step starts waiting
// for it before navigating, and the assertions inspect the captured request.
let pixelRequestPromise: Promise<Request>;

// The first snapshot's content fetch, issued automatically once the version
// history loads. The `track:event` 'Snapshot' 'Viewed' analytics event is
// published on the in-page mediator and has no subscriber, so it produces no
// network request. The real outbound HTTP request we can observe for a snapshot
// view is therefore this version fetch — its URL
// (`/api/1/version/{systemId}/{contentId}/{timestamp}`) carries both the content
// id and the snapshot timestamp.
let snapshotRequestPromise: Promise<Request>;
let capturedSnapshotRequest: Request;

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

Given("the analytics service is active", async ({ page, localStack }) => {
    // The AnalyticsService is required by the app's run block (main.js), so it is
    // constructed and starts listening for `$routeChangeSuccess` as soon as the
    // Angular app bootstraps. Load the root splash page and wait for it to render
    // to confirm the service is active.
    await page.goto(localStack.baseUrl, { waitUntil: "domcontentloaded" });
    // The splash screen's search box is a reliable signal that the SPA has
    // bootstrapped and the initial route has resolved.
    await expect(page.getByLabel("Enter a composer url:")).toBeVisible({
        timeout: timeout,
    });
});

When("I navigate to a new page in the application", async ({ page, localStack }) => {
    // Start waiting for the outbound tracking-pixel request before navigating so
    // the route change's pixel is observed. The pixel targets a telemetry host
    // that does not resolve in the test environment, but the request is still
    // dispatched by the browser, so `waitForRequest` captures it regardless.
    pixelRequestPromise = page.waitForRequest(/guardian-tool-accessed/, {
        timeout: timeout,
    });

    // Navigating to a different in-app route triggers a `$routeChangeSuccess`,
    // which the active AnalyticsService responds to by requesting a tracking
    // pixel for the new path.
    await page.goto(
        localStack.baseUrl + "/content/568c4110e4b0c73bdb0e52df/versions",
        { waitUntil: "domcontentloaded" },
    );
});

Then("a tracking pixel should be requested", async () => {
    // The AnalyticsService loads the pixel from `<client>/guardian-tool-accessed`
    // on the route change; awaiting the request confirms it was dispatched.
    const request = await pixelRequestPromise;
    expect(request.url()).toContain("/guardian-tool-accessed");
});

Then("the request should include app=restorer", async () => {
    // The pixel URL carries `app=restorer` to identify the source tool.
    const request = await pixelRequestPromise;
    expect(request.url()).toContain("app=restorer");
});

Then("the request should include the current route path", async () => {
    // The pixel URL carries `path=<route>` for the page that was navigated to.
    const request = await pixelRequestPromise;
    expect(decodeURIComponent(request.url())).toContain(
        "path=/content/568c4110e4b0c73bdb0e52df/versions",
    );
});
