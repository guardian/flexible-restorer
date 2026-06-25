const { defineConfig } = require("@playwright/test");
const { defineBddConfig } = require("playwright-bdd");

// Generate Playwright tests from the BDD feature files. Only the features that
// currently have step definitions are included here.
const bddTestDir = defineBddConfig({
    features: [
        "tests/features/content-search.feature",
        "tests/features/content-snapshot-content.feature",
    ],
    steps: ["tests/e2e/fixtures.ts", "tests/e2e/steps/*.ts"],
});

module.exports = defineConfig({
    timeout: 15 * 60 * 1000,
    expect: {
        timeout: 10 * 1000,
    },
    retries: 0,
    reporter: [["list"]],
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
