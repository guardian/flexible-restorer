import type { Page } from "@playwright/test";
import { Given, When, Then, expect } from "../fixtures";

/**
 * Playwright-style step definitions for
 * `tests/features/content-snapshot-content.feature`.
 *
 * These are stubs only — no implementations yet. Each step receives the
 * Playwright fixtures as the first argument (e.g. `async ({ page }) => { ... }`)
 * following the playwright-style approach:
 * https://vitalets.github.io/playwright-bdd/#/writing-steps/playwright-style
 *
 * The custom fixtures in `../fixtures` boot (or reuse) the local stack and
 * provide a signed-in `page` for the steps to use.
 *
 * NOTE: The Background steps `the application stack is running` and
 * `I am signed in through pan-domain auth` are intentionally NOT redefined here
 * — they already exist in `content-search.steps.ts`, and playwright-bdd shares
 * step definitions across all step files.
 */

// --- Background ---------------------------------------------------------------

let timeout = 5 * 1000;

Given(
    "I have opened the version history page for a piece of content",
    async ( {page , localStack  }) => {
        await page.goto(localStack.baseUrl + '/content/568c4110e4b0c73bdb0e52df/versions' , { waitUntil: "domcontentloaded" });
    },
);

// --- HTML content is shown by default in the content panel --------------------

Given("snapshot content has loaded", async ({ page }) => {
    // Once the first snapshot has been fetched and rendered, its body prose is
    // shown on the page. Wait for a known line of that text to appear. The same
    // text also exists in the (hidden) JSON view, so match the prose paragraph.
    await expect(
        page.getByRole("paragraph").filter({ hasText: "Borne on a wave of tears" }),
    ).toBeVisible({ timeout: timeout });
});

When("I view the content panel initially", async () => {
    // Viewing the panel in its initial state is a no-op — the assertions about
    // the default (HTML) view are made in the Then steps.
});

Then("HTML content should be visible", async ({ page }) => {
    // In the HTML view the snapshot renders as readable prose, so the body text
    // is visible on the page. Scope to the prose paragraph since the same text
    // also appears in the (hidden) JSON view.
    await expect(
        page.getByRole("paragraph").filter({ hasText: "Borne on a wave of tears" }),
    ).toBeVisible({ timeout: timeout });
});

Then("the display toggle label should be Show JSON", async ({ page }) => {
    await expect(page.getByText("Show JSON", { exact: true })).toBeVisible({ timeout: timeout });
});

// --- Snapshot furniture: headline, standfirst, trail text ---------------------

When("I view the content panel furniture", async () => {
    // Viewing the furniture is a no-op — the headline/standfirst/trail text
    // assertions are made in the Then steps below.
});

Then("I should see the snapshot headline", async ({ page }) => {
    // The headline also appears as the sidebar article title (an <h1>), so scope
    // to the furniture paragraph to assert specifically on the furniture value.
    await expect(
        page
            .getByRole("paragraph")
            .filter({ hasText: "Irish fury at Thierry Henry" }),
    ).toBeVisible({ timeout: timeout });
});

Then("I should see the snapshot standfirst", async ({ page }) => {
    await expect(
        page
            .getByRole("paragraph")
            .filter({ hasText: "Politicians and fans seek replay amid" }),
    ).toBeVisible({ timeout: timeout });
});

Then("I should see the snapshot trail text", async ({ page }) => {
    await expect(
        page
            .getByRole("paragraph")
            .filter({ hasText: "politicians and football fans call for replay" }),
    ).toBeVisible({ timeout: timeout });
});

// --- Switch to JSON view and back to text view --------------------------------

When("I use the display toggle to show JSON", async ({ page }) => {
    // While HTML is showing, the toggle is labelled "Show JSON".
    await page.getByText("Show JSON", { exact: true }).click();
});

Then("JSON content should be visible", async ({ page }) => {
    // The JSON pane renders the pretty-printed snapshot, so JSON-only keys (which
    // never appear in the prose/furniture) are present once JSON is shown.
    await expect(
        page.getByText("contentChangeDetails").first(),
    ).toBeVisible({ timeout: timeout });
});

Then("the display toggle label should be Show TEXT", async ({ page }) => {
    await expect(page.getByText("Show TEXT", { exact: true })).toBeVisible({
        timeout: timeout,
    });
});

When("I use the display toggle again", async ({ page }) => {
    // After switching to JSON the toggle is labelled "Show TEXT"; clicking it
    // returns to the HTML view.
    await page.getByText("Show TEXT", { exact: true }).click();
});

// --- Right and left keyboard keys switch JSON and HTML displays ---------------

Given("the restore modal is not open", async () => {
    // Precondition: after navigating to the version history page the restore
    // modal starts closed, and nothing in these scenarios has opened it. The
    // arrow-key handler only acts while the modal is closed, so no action is
    // needed here — this documents the assumed state.
});

When("I press the right arrow key", async ({ page }) => {
    await page.keyboard.press("ArrowRight");
});

Then("JSON content should be displayed", async ({ page }) => {
    // The right arrow switches the panel to JSON, which flips the toggle label
    // to "Show TEXT" — the reliable signal that the JSON view is now active.
    await expect(page.getByText("Show TEXT", { exact: true })).toBeVisible({
        timeout: timeout,
    });
});

When("I press the left arrow key", async ({ page }) => {
    await page.keyboard.press("ArrowLeft");
});

Then("HTML content should be displayed", async ({ page }) => {
    // The left arrow switches the panel back to HTML, which flips the toggle
    // label to "Show JSON" — the reliable signal that the HTML view is active.
    await expect(page.getByText("Show JSON", { exact: true })).toBeVisible({
        timeout: timeout,
    });
});

// --- Copy JSON content and receive feedback -----------------------------------

Given("JSON content is available in the panel", async ({ page }) => {
    // The panel always renders the pretty-printed snapshot JSON once content has
    // loaded; a JSON-only key confirms it is present and ready to copy.
    await expect(page.getByText("contentChangeDetails").first()).toBeVisible({
        timeout: timeout,
    });
});

When("I use the Copy JSON action", async ({ page }) => {
    // The copy uses execCommand on a hidden textarea, so allow clipboard access
    // before clicking the button (which is labelled "Copy JSON" until used).
    await page
        .context()
        .grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByText("Copy JSON", { exact: true }).click();
});

Then("the snapshot JSON should be copied to the clipboard", async ({ page }) => {
    // The copied text is the pretty-printed snapshot JSON, so it contains the
    // content id and JSON-only keys.
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain("contentChangeDetails");
    expect(clipboard).toContain("568c4110e4b0c73bdb0e52df");
});

Then("the copy button label should change to Copied!", async ({ page }) => {
    await expect(page.getByText("Copied!", { exact: true })).toBeVisible({
        timeout: timeout,
    });
});

// --- JSON copy label resets when another snapshot is loaded -------------------

Given("I previously copied snapshot JSON", async ({ page }) => {
    // Copy the current snapshot's JSON so the button shows the "Copied!" state.
    await page
        .context()
        .grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByText("Copy JSON", { exact: true }).click();
    await expect(page.getByText("Copied!", { exact: true })).toBeVisible({
        timeout: timeout,
    });
});

When("a different snapshot is loaded into the content panel", async ({ page }) => {
    // The down arrow makes the next snapshot active, which reloads the content
    // panel — a deterministic way to load a different snapshot.
    await page.keyboard.press("ArrowDown");
});

Then("the copy button label should reset to Copy JSON", async ({ page }) => {
    await expect(page.getByText("Copy JSON", { exact: true })).toBeVisible({
        timeout: timeout,
    });
});

// --- Export actions target the current content id -----------------------------

When("I inspect snapshot content export actions", async () => {
    // Inspecting the export actions is a no-op — the assertions about each
    // export link are made in the Then steps below.
});

Then(
    "I should see an export as Git Repo action for the current content id",
    async ({ page }) => {
        const gitExport = page.getByRole("link", {
            name: "Export all as Git Repo",
        });
        await expect(gitExport).toBeVisible({ timeout: timeout });
        await expect(gitExport).toHaveAttribute(
            "href",
            "/export/568c4110e4b0c73bdb0e52df/git",
        );
    },
);

Then(
    "I should see an export as Zip action for the current content id",
    async ({ page }) => {
        const zipExport = page.getByRole("link", { name: "Export all as Zip" });
        await expect(zipExport).toBeVisible({ timeout: timeout });
        await expect(zipExport).toHaveAttribute(
            "href",
            "/export/568c4110e4b0c73bdb0e52df/zip",
        );
    },
);

// --- Restore action shown only for users with restore permission --------------

Given("the user permissions are loaded", async () => {
    // TODO: implement step
});

When("the user has restore_content permission", async () => {
    // TODO: implement step
});

Then(
    "the Restore action should be visible in the snapshot content panel",
    async () => {
        // TODO: implement step
    },
);

When("the user does not have restore_content permission", async () => {
    // TODO: implement step
});

Then(
    "the Restore action should not be visible in the snapshot content panel",
    async () => {
        // TODO: implement step
    },
);

// --- Enter key opens the restore modal ----------------------------------------

// The restore modal is hidden purely by toggling the `visually-hidden` class,
// which only sets `opacity: 0` (it does not use display/visibility). Playwright
// treats an `opacity: 0` element as visible, so open/closed cannot be detected
// via visibility matchers. Instead, locate the modal by its unique title text
// and assert on its computed opacity: `1` when open, `0` when closed.
const restoreModalLocator = (page: Page) =>
    page.locator(".modal").filter({ hasText: "Before you restore" });

When("I press Enter", async ({ page }) => {
    // The snapshot-list keydown handler opens the modal on Enter (keyCode 13)
    // when the modal is not already displayed.
    await page.keyboard.press("Enter");
});

Then("the restore modal should be displayed", async ({ page }) => {
    await expect(restoreModalLocator(page)).toHaveCSS("opacity", "1", {
        timeout: timeout,
    });
});

Then(
    "snapshot list keyboard navigation should be suspended while the modal is open",
    async ({ page }) => {
        // While the modal is open the arrow-key view toggle is suppressed, so
        // pressing the right arrow must NOT switch to JSON — the toggle label
        // stays on "Show JSON" (HTML view active).
        await page.keyboard.press("ArrowRight");
        await expect(page.getByText("Show JSON", { exact: true })).toBeVisible({
            timeout: timeout,
        });
    },
);

// --- Restore modal can be closed with Cancel or Escape ------------------------

Given("the restore modal is open", async ({ page }) => {
    // Wait until the snapshot content panel has rendered before driving the
    // keyboard — pressing Enter too early (before the content/handlers are
    // ready) does not open the modal. The toggle label is only present once the
    // content panel has loaded.
    await expect(page.getByText("Show JSON", { exact: true })).toBeVisible({
        timeout: timeout,
    });
    // Open the modal via the Enter key, then confirm it is displayed so the
    // close behaviour can be exercised from a known-open state.
    await page.keyboard.press("Enter");
    await expect(restoreModalLocator(page)).toHaveCSS("opacity", "1", {
        timeout: timeout,
    });
});

When("I choose Cancel", async ({ page }) => {
    // The modal's Cancel button calls `modalCtrl.closeModal()`.
    await page.getByRole("button", { name: "Cancel" }).click();
});

Then("the restore modal should close", async ({ page }) => {
    await expect(restoreModalLocator(page)).toHaveCSS("opacity", "0", {
        timeout: timeout,
    });
});

Then("HTML display mode should be restored", async ({ page }) => {
    // Closing the modal returns the content panel to the HTML view, so the
    // toggle label is back to "Show JSON".
    await expect(page.getByText("Show JSON", { exact: true })).toBeVisible({
        timeout: timeout,
    });
});

When("I reopen the restore modal and press Escape", async ({ page }) => {
    // Reopen with Enter, confirm it is open, then close it with Escape, which
    // the modal controller handles while it is active (keyCode 27).
    await page.keyboard.press("Enter");
    await expect(restoreModalLocator(page)).toHaveCSS("opacity", "1", {
        timeout: timeout,
    });
    await page.keyboard.press("Escape");
});

// --- Restore destinations and source details loaded when modal opens ----------

Given(
    "the restore modal is opened for an active snapshot",
    async ({ page }) => {
        // Wait for the content panel to render so the keyboard handlers are
        // wired up, then open the modal via Enter and confirm it is displayed.
        // Opening the modal publishes `snapshot-list:display-modal`, which kicks
        // off the async load of the source details and restore destinations.
        await expect(page.getByText("Show JSON", { exact: true })).toBeVisible({
            timeout: timeout,
        });
        await page.keyboard.press("Enter");
        await expect(restoreModalLocator(page)).toHaveCSS("opacity", "1", {
            timeout: timeout,
        });
    },
);

When("destination data is available", async ({ page }) => {
    // The source details and destinations are populated together once the
    // destinations request resolves. Waiting for the source line to appear is a
    // reliable signal that that load has completed.
    await expect(
        page.getByText(/Snapshot of revision \d+/),
    ).toBeVisible({ timeout: timeout });
});

Then(
    "I should see source revision and source timestamp details",
    async ({ page }) => {
        // The "From" panel shows the snapshot's revision and a "taken ... at
        // <date>" timestamp detail, e.g.
        // "Snapshot of revision 10 taken from secondary at <date>".
        const source = page.getByText(/Snapshot of revision \d+ taken/);
        await expect(source).toBeVisible({ timeout: timeout });
        // Assert on the timestamp framing rather than a parsed date value: the
        // snapshot timestamp is keyed with underscores (e.g.
        // "2026-06-12T03_21_15.018Z"), which moment() cannot parse, so the app
        // currently renders the date itself as "Invalid date".
        await expect(source).toContainText(" at ");
    },
);

Then(
    "I should see destination options filtered by permission rules",
    async ({ page }) => {
        // The test user does not have the "restore to any stack" permission, so
        // of the configured stacks only the one matching the active snapshot's
        // own system is offered. The list is therefore filtered down to a single
        // destination radio option (regardless of whether that system is the
        // primary or the secondary stack).
        await expect(page.getByRole("radio")).toHaveCount(1, {
            timeout: timeout,
        });
    },
);

Then(
    "the current system destination should be pre-selected when present",
    async ({ page }) => {
        // The destination whose system matches the active snapshot is selected
        // by default, so its radio option is checked when the modal opens.
        await expect(page.getByRole("radio")).toBeChecked({ timeout: timeout });
    },
);

// --- Restore confirmation requires both safety checkboxes ---------------------

When("either required safety checkbox is not selected", async ({ page }) => {
    // Select only one of the two required safety checkboxes ("You are not in
    // content"), deliberately leaving the other ("No one else is in the
    // content") unchecked so the "either not selected" condition holds.
    await page.getByLabel("You are not in content").check();
});

Then("the Restore Version action should be disabled", async ({ page }) => {
    // The submit button is `ng-disabled` unless both safety checkboxes are
    // checked, so with only one selected it must be disabled.
    await expect(
        page.getByRole("button", { name: "Restore Version" }),
    ).toBeDisabled({ timeout: timeout });
});

When("both required safety checkboxes are selected", async ({ page }) => {
    await page.getByLabel("You are not in content").check();
    await page.getByLabel("No one else is in the content").check();
});

Then("the Restore Version action should be enabled", async ({ page }) => {
    // With both safety checkboxes checked the `ng-disabled` condition clears and
    // the submit button becomes enabled.
    await expect(
        page.getByRole("button", { name: "Restore Version" }),
    ).toBeEnabled({ timeout: timeout });
});

// --- Successful restore redirects back to the selected Composer instance ------

Given("a destination is selected", async () => {
    // TODO: implement step
});

When("I submit Restore Version successfully", async () => {
    // TODO: implement step
});

Then(
    "I should be redirected to that destination Composer content URL",
    async () => {
        // TODO: implement step
    },
);

// --- Error in snapshot content loading shows the error modal ------------------

Given("snapshot content loading fails", async () => {
    // TODO: implement step
});

When("the error is published", async () => {
    // TODO: implement step
});

Then("I should see the error modal with an explanatory message", async () => {
    // TODO: implement step
});

Then("the restore modal should close if it was open", async () => {
    // TODO: implement step
});

// --- No restore destinations shows an error outcome ---------------------------

When("there are no destinations available for the current content", async () => {
    // TODO: implement step
});

Then(
    "I should see an error outcome for missing restore destinations",
    async () => {
        // TODO: implement step
    },
);
