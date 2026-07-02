import type { APIResponse, Download } from "@playwright/test";
import { Given, When, Then, expect } from "../fixtures";
import { execFileSync } from "child_process";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

/**
 * Playwright-style step definitions for `tests/features/export.feature`.
 *
 * These are stubs only — no implementations yet. Each step receives the
 * Playwright fixtures as the first argument (e.g. `async ({ page }) => { ... }`)
 * following the playwright-style approach:
 * https://vitalets.github.io/playwright-bdd/#/writing-steps/playwright-style
 *
 * NOTE: The Background steps `the application stack is running` and
 * `I am signed in through pan-domain auth` are intentionally NOT redefined here
 * — they already exist in `content-search.steps.ts`, and playwright-bdd shares
 * step definitions across all step files.
 */

// The download triggered by an export action, captured in the When step so the
// following Then step can assert on it.
let lastDownload: Download | undefined;

// A content id that has no snapshots in any source stack. It is a well-formed
// 24-hex id (matching SnapshotId's expected shape) that does not exist in the
// fixtures, so listing snapshots for it returns nothing.
const contentIdWithoutSnapshots = "000000000000000000000000";

// The response captured when requesting an export for content with no
// snapshots, asserted on by the following Then steps.
let exportResponse: APIResponse | undefined;

// --- Exporting as a zip returns snapshot files for the requested content ------

Given("version history exists for a piece of content", async ( {page , localStack  }) => {
    await page.goto(localStack.baseUrl + '/content/568c4110e4b0c73bdb0e52df/versions' , { waitUntil: "domcontentloaded" });
});

When("I request the zip export for that content", async ({ page }) => {
    // Set up the download waiter BEFORE the click that triggers it, then keep
    // the resulting Download so the next step can assert the file arrived.
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Export all as Zip" }).click();
    lastDownload = await downloadPromise;
});

Then("I should receive a downloadable zip archive", async () => {
    // A download event fired and Playwright saved the file. Assert we captured a
    // download whose suggested filename is a .zip.
    expect(lastDownload).toBeDefined();
    expect(lastDownload?.suggestedFilename()).toMatch(/\.zip$/);
});

Then(
    "the archive should contain live, preview, and metadata files for each snapshot",
    async () => {
        expect(lastDownload).toBeDefined();

        // Read the downloaded archive from the temp path Playwright saved it to,
        // and list its entries. `unzip -Z1` prints one entry name per line.
        const zipPath = await lastDownload!.path();
        expect(zipPath).not.toBeNull();
        const entries = execFileSync("unzip", ["-Z1", zipPath!], {
            encoding: "utf8",
        })
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);

        // Each snapshot contributes three files named `<timestamp>-live.json`,
        // `<timestamp>-preview.json` and `<timestamp>-metadata.json`
        // (see app/controllers/Export.scala#exportAsZip). Derive the set of
        // snapshot timestamps from the entries, then assert each timestamp has
        // all three files present.
        const timestamps = new Set(
            entries
                .map(
                    (name) =>
                        name.match(
                            /^(.*)-(?:live|preview|metadata)\.json$/,
                        )?.[1],
                )
                .filter((ts): ts is string => Boolean(ts)),
        );
        expect(timestamps.size).toBeGreaterThan(0);
        for (const ts of timestamps) {
            expect(entries).toContain(`${ts}-live.json`);
            expect(entries).toContain(`${ts}-preview.json`);
            expect(entries).toContain(`${ts}-metadata.json`);
        }
    },
);

// --- Exporting content with no snapshots returns not found --------------------

Given("a piece of content has no snapshots", async () => {
    // Use a well-formed content id that is absent from the fixtures, so the
    // export controller finds no snapshots for it. No navigation is needed — the
    // export endpoints are hit directly in the next step.
    exportResponse = undefined;
});

When("I request either export format for that content", async ({ page, localStack }) => {
    // Hit an export endpoint directly for the snapshot-less content id. The
    // request shares the signed-in cookie from the browser context. Both export
    // formats behave identically for missing content, so exercising the zip
    // format is representative (see app/controllers/Export.scala).
    exportResponse = await page.request.get(
        `${localStack.baseUrl}/export/${contentIdWithoutSnapshots}/zip`,
    );
});

Then("the response should be not found", async () => {
    // The export controller returns 404 Not Found when the content has no
    // snapshots.
    expect(exportResponse?.status()).toBe(404);
});

Then(
    "the response should explain that the content has no snapshots",
    async () => {
        // The 404 body is `"<contentId> does not have any snapshots"`
        // (Export.scala), naming the requested content and the reason.
        const body = (await exportResponse?.text()) ?? "";
        expect(body).toContain("does not have any snapshots");
        expect(body).toContain(contentIdWithoutSnapshots);
    },
);
