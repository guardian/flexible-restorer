const { defineConfig } = require("@playwright/test");
const { defineBddConfig, cucumberReporter } = require("playwright-bdd");

// Generate Playwright tests from the BDD feature files. Only the features that
// currently have step definitions are included here.
const bddTestDir = defineBddConfig({
    features: [
        "tests/features/content-search.feature",
        "tests/features/content-snapshot-content.feature",
        "tests/features/analytics.feature",
        "tests/features/authentication.feature",
        "tests/features/content-version-list.feature",
    ],
    steps: ["tests/e2e/fixtures.ts", "tests/e2e/steps/*.ts"],
});

module.exports = defineConfig({
    timeout: 15 * 60 * 1000,
    expect: {
        timeout: 10 * 1000,
    },
    retries: 0,
    reporter: [
        ["list"],
        // Enable the Cucumber HTML report only when REPORT is set, e.g.
        // `REPORT=1 npm run test:e2e`.
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
        // BDD scenarios generated from tests/features/*.feature
        {
            name: "bdd",
            testDir: bddTestDir,
        },
    ],
});
