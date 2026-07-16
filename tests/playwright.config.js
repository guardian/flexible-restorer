const { defineConfig } = require("@playwright/test");
const { defineBddConfig, cucumberReporter } = require("playwright-bdd");
const path = require("path");

// Generate Playwright tests from the BDD feature files. Only the features that
// currently have step definitions are included here.
const bddTestDir = defineBddConfig({
    features: [
        "features/content-search.feature",
        "features/content-snapshot-content.feature",
        "features/analytics.feature",
        "features/authentication.feature",
        "features/content-version-list.feature",
        "features/export.feature",
        "features/content-restore.feature",
    ],
    steps: ["e2e/fixtures.ts", "e2e/steps/*.ts"],
});

module.exports = defineConfig({
    // Fail an individual test fast rather than letting a hung test hold the run.
    timeout: 15 * 1000,
    // Cap the entire run (global setup + all tests) so nothing can hang for long.
    globalTimeout: 3 * 60 * 1000,
    // Start a single local stack once for the whole run (see
    // e2e/globalSetup.ts) and stop it afterwards, so workers all share one
    // stack instead of each booting their own in parallel.
    globalSetup: path.join(__dirname, "e2e/globalSetup.ts"),
    globalTeardown: path.join(__dirname, "e2e/globalTeardown.ts"),
    expect: {
        timeout: 10 * 1000,
    },
    // All workers share a single local stack (one restorer instance). Its
    // destination lookups query each stack with a blocking 3s timeout, so too
    // many concurrent requests can starve its thread pool and make reachable
    // stacks look unavailable. Cap concurrency to keep the load it sees modest.
    workers: process.env.CI ? 2 : 4,
    // Retry once so an occasional load-induced flake (e.g. a destination lookup
    // timing out under contention) doesn't fail the whole run.
    retries: 1,
    reporter: [
        ["list"],
        // Enable the Cucumber HTML report only when REPORT is set, e.g.
        // `REPORT=1 mise run test:e2e`.
        ...(process.env.REPORT
            ? [
                  cucumberReporter("html", {
                      outputFile: "cucumber-report/index.html",
                      externalAttachments: true,
                  }),
              ]
            : []),
    ],
    use: {
        // Pin the browser timezone and locale so date rendering is
        // deterministic across machines. The app formats snapshot dates with
        // `moment(...).format(...)` in the browser's local timezone, and several
        // fixtures use London offsets near midnight (e.g. the embargo fixture
        // `2015-06-29T00:01:00+01:00`). Without a fixed timezone a UTC CI runner
        // renders the previous day ("Sun 28 June") and fails assertions that a
        // London/BST developer machine passes ("Mon 29 June").
        timezoneId: "Europe/London",
        locale: "en-GB",
        // Run headed (visible browser) when HEADED is set, e.g. `HEADED=1`.
        headless: !process.env.HEADED,
        // Slow down each Playwright action by SLOWMO ms, e.g. `SLOWMO=500`.
        launchOptions: {
            slowMo: Number(process.env.SLOWMO ?? 0),
        },
        trace: "on",
        video: "on",
        screenshot: "only-on-failure",
    },
    projects: [
        // BDD scenarios generated from features/*.feature
        {
            name: "bdd",
            testDir: bddTestDir,
        },
    ],
});
