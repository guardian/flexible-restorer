import type { Request } from "@playwright/test";
import { Before, Given, When, Then, expect } from "../fixtures";

/**
 * Steps for e2e-tests/features/analytics.feature.
 * Stack and sign-in steps come from content-search.steps.ts; snapshot-loading
 * and restore-modal steps come from content-snapshot-content.steps.ts.
 * playwright-bdd shares these definitions across files; do not redefine them.
 */
// Skip scenarios tagged @pending; playwright-bdd hooks apply across features.
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


// --- A route change sends a tracking pixel for the current page path ----------

Given("the analytics service is active", async ({ page, localStack }) => {
    // App calls trackRoute when the pathname changes. Load the splash page
    // before exercising navigation to another route.
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

    // Loading a different route sends a tracking pixel for its pathname.
    await page.goto(
        localStack.baseUrl + "/content/568c4110e4b0c73bdb0e52df/versions",
        { waitUntil: "domcontentloaded" },
    );
});

Then("a tracking pixel should be requested", async () => {
    // Awaiting the captured request confirms the tracking pixel was requested.
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
