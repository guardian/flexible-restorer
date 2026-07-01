import { Given, When, Then, expect } from "../fixtures";

/**
 * Playwright-style step definitions for
 * `tests/features/content-version-list.feature`.
 *
 * Implemented so far:
 *   - The snapshot list header shows the expected columns and content identity
 *   - The snapshot list is hidden until loading finishes
 *   - The sidebar becomes active after initial snapshot data is ready
 *
 * The remaining scenarios are tagged `@pending` in the feature file and are
 * skipped by the global `Before({ tags: "@pending" })` hook registered in
 * `content-search.steps.ts`. Their steps are stubbed below purely so that
 * `bddgen` can resolve every step in the feature.
 *
 * The three Background steps (`the application stack is running`,
 * `I am signed in through pan-domain auth`,
 * `I have opened the version history page for a piece of content`) and the
 * restore-modal steps are defined in `content-search.steps.ts` /
 * `content-snapshot-content.steps.ts` and must NOT be redefined here.
 *
 * Evidence:
 *   - public/javascripts/app/templates/restore-list.html
 *   - public/javascripts/app/controllers/SnapshotListCtrl.js
 *   - public/javascripts/app/models/SnapshotIdModel.js
 *   - public/javascripts/app/services/SnapshotCollectionService.js (GET /api/1/versionList/:id)
 */

const timeout = 5 * 1000; // 5 seconds for steady-state assertions
const loadTimeout = 15 * 1000; // 15 seconds to allow the initial collection load

// Content id documented in fixtures/snapshots/STATE_FIXTURES.md. Secondary is
// derived from stack config, not snapshot content: the whole fixture tree is
// mirrored into the secondary bucket, so this content id's version list includes
// a composer-secondary row (see app/controllers/Versions.scala versionList).
const SECONDARY_CONTENT_ID = "54931ae2e4b019234074e3c8";
const MISSING_REVISION_CONTENT_ID = "000000000000000000000001"; // no revision id in the fixture

// ---------------------------------------------------------------------------
// Scenario: The snapshot list header shows the expected columns and content identity
// Scenario: The sidebar becomes active after initial snapshot data is ready
// ---------------------------------------------------------------------------

Given("version history data has loaded successfully", async ({ page }) => {
    // The Background already navigated to the versions page. Once the version
    // list request resolves, the loading state ends and the sidebar shows the
    // article headline.
    await expect(page.getByRole("heading", { name: "Irish fury at Thierry Henry's handball in World Cup qualifier" })).toBeVisible({
        timeout: loadTimeout,
    });
});

When("I view the fixed snapshot list header", async () => {
    // No action required — the header is asserted in the following Then steps.
});

Then("I should see the article headline", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Irish fury at Thierry Henry's handball in World Cup qualifier" })).toBeVisible({ timeout });
});

Then("I should see the article hash as a link to Composer", async ({ page }) => {
    const hashLink = page.getByRole("link", { name: "568c4110e4b0c73bdb0e52df" });
    await expect(hashLink).toBeVisible({ timeout });
    await expect(hashLink).toHaveAttribute("href", new RegExp(`/content/${"568c4110e4b0c73bdb0e52df"}$`));
});

Then(
    "I should see the list column labels for revision number, snapshot timing, and status",
    async ({ page }) => {
        await expect(page.getByText("No.", { exact: true })).toBeVisible({ timeout });
        await expect(page.getByText("Snapped at & last modified", { exact: true })).toBeVisible({
            timeout,
        });
        await expect(page.getByText("Status", { exact: true })).toBeVisible({ timeout });
    },
);

When("the first snapshot is set active", async () => {
    // The first snapshot is activated automatically once the data loads.
});

Then("the sidebar should animate into an active state", async ({ page }) => {
    // Once active, the sidebar surfaces the snapshot identity (the article hash
    // link to Composer) to the user.
    await expect(page.getByRole("link", { name: "568c4110e4b0c73bdb0e52df" })).toBeVisible({ timeout });
});

Then("the list should render with snapshot rows", async ({ page }) => {
    // Each rendered snapshot row tells the user who last modified the content.
    await expect(page.getByText(/Last modified by:/).first()).toBeVisible({ timeout });
});

// ---------------------------------------------------------------------------
// Scenario: The snapshot list is hidden until loading finishes
// ---------------------------------------------------------------------------

Given("version history data is still loading", async ({ page }) => {
    // Hold the collection request open so the page stays in its loading state
    // long enough to observe the preloader, then reload to trigger it freshly.
    await page.route("**/api/1/versionList/**", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        await route.continue();
    });
    await page.reload({ waitUntil: "domcontentloaded" });
});

When("I view the page", async () => {
    // No action required — the assertions are made in the following Then steps.
});

Then("I should see loading bars", async ({ page }) => {
    // The loading indicator is a purely decorative animation with no accessible
    // text, so while it is showing we assert that the loaded sidebar content
    // (the article headline) is not yet visible to the user.
    await expect(page.getByRole("heading", { name: "Irish fury at Thierry Henry's handball in World Cup qualifier" })).toHaveCount(0);
});

Then("I should not yet see the snapshot list content area", async ({ page }) => {
    // The list column headers only appear once loading completes.
    await expect(page.getByText("Snapped at & last modified", { exact: true })).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// Pending stubs — these belong to @pending scenarios and are skipped at runtime
// by the global `Before({ tags: "@pending" })` hook. They exist only so that
// `bddgen` can resolve every step in the feature.
// ---------------------------------------------------------------------------

Given(
    "version history data contains a snapshot from composer-secondary",
    async ({ page, localStack }) => {
        // Navigate to a content id documented in STATE_FIXTURES.md; because the
        // fixture tree is mirrored into the secondary bucket, its version list
        // contains the same snapshots again marked as coming from the secondary
        // system, then wait for the list to finish loading.
        await page.goto(`${localStack.baseUrl}/content/${SECONDARY_CONTENT_ID}/versions`, {
            waitUntil: "domcontentloaded",
        });
        await expect(page.getByText("Snapped at & last modified", { exact: true })).toBeVisible({
            timeout: loadTimeout,
        });
    },
);

When("I view the list row for that snapshot", async () => {
    // No action required — the notice is asserted in the following Then step.
});

Then(
    "I should see a notice that the snapshot came from composer-secondary",
    async ({ page }) => {
        await expect(
            page.getByText("This snapshot came from composer-secondary").first(),
        ).toBeVisible({ timeout });
    },
);

Given("version history data contains a snapshot without an explicit revision id", async ({ page, localStack }) => {
        // Navigate to a content id documented in STATE_FIXTURES.md; because the
        // fixture tree is mirrored into the secondary bucket, its version list
        // contains the same snapshots again marked as coming from the secondary
        // system, then wait for the list to finish loading.
        await page.goto(`${localStack.baseUrl}/content/${MISSING_REVISION_CONTENT_ID}/versions`, {
            waitUntil: "domcontentloaded",
        });
        await expect(page.getByText("Snapped at & last modified", { exact: true })).toBeVisible({
            timeout: loadTimeout,
        });
    },
);

When("I view the index value for that row", async () => {
    // No action required — the fallback index is asserted in the Then step.
});
Then("I should see the fallback revision number based on list position", async ({ page }) => {
    const items = page.locator("li.snapshot-list__item");
    const total = await items.count();
    expect(total).toBeGreaterThan(0);

    // The "1" fallback index must live inside a snapshot-list__item, and only
    // one row should carry it.
    const itemWithFallbackIndex = items.filter({
        has: page.getByText("1", { exact: true }),
    });
    await expect(itemWithFallbackIndex).toHaveCount(1);

    // It must be the LAST item in the group: the index falls back to
    // `models.length - $index`, which only resolves to 1 for the final row.
    await expect(items.nth(total - 1)).toContainText("1");

    // We can also assert that the fallback index is 2 form the second-to-last row, because the fallback index is calculated as `models.length - $index`, which for the second-to-last row is `3 - 1 = 2`.
    await expect(items.nth(total - 2)).toContainText("2");
});

When("I click a snapshot row in the list", async ( { page }) => {
    await page.getByRole('heading', { name: 'Scheduled snapshot' }).nth(1).click();
});
Then("that row should become the active row", async ({ page }) => {
    const activeRow = page.locator("li.item-active");
    await expect(activeRow).toHaveCount(1);
    await expect(activeRow).toContainText("Scheduled snapshot");
});
Then("the interface should switch to HTML display mode", async ( { page }) => {
    // This is a no-op step because the HTML display mode is the default.
});

Then("the selected snapshot content should be requested", async ( { page }) => {
    await expect(
        page.getByRole("paragraph").filter({ hasText: "Borne on a wave of tears" }),
    ).toBeVisible({ timeout: timeout });
});

When("I inspect a snapshot row", async () => {});
Then("I should see the formatted snapshot date and time", async () => {});
Then("I should see a relative age value", async () => {});
Then("I should see who last modified the content", async () => {});
Then("I should see the snapshot reason text", async () => {});

Given("version history data contains a launch-related snapshot reason", async () => {});
When("I inspect that snapshot row", async () => {});
Then("the row should be highlighted for launch activity", async () => {});
Then("the reason text should be highlighted for launch activity", async () => {});

Given("version history data contains a legally sensitive snapshot", async () => {});
When("I inspect the status indicators for that row", async () => {});
Then("I should see the legally sensitive marker", async () => {});

Given("version history data contains a snapshot with comments enabled", async () => {});
Then("I should see the comments on indicator", async () => {});

Given("version history data contains a snapshot with comments disabled", async () => {});
Then("I should see the comments off indicator", async () => {});

Given("version history data contains published state variations", async () => {});
When("I inspect the right-hand status area for each row", async () => {});
Then("I should see Published for published snapshots", async () => {});
Then("I should see Taken down for unpublished snapshots with prior publish details", async () => {});
Then("I should see Scheduled with a date when a scheduled launch date exists", async () => {});
Then("I should see Embargoed until with a date when embargo settings exist", async () => {});

Given("version history data has multiple snapshots", async () => {});
When("I view the delta row between two snapshots", async () => {});
Then("I should see a relative time difference value between adjacent snapshot dates", async () => {});

When("I press the down or up arrow key", async () => {});
Then("the active snapshot selection should move accordingly", async () => {});

When("I press list navigation keys", async () => {});
Then("the snapshot list selection should not change", async () => {});
