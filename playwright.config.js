const { defineConfig } = require("@playwright/test");
const { defineBddConfig } = require("playwright-bdd");

// Generate Playwright tests from the BDD feature files. Only the features that
// currently have step definitions are included here.
const bddTestDir = defineBddConfig({
    features: "tests/features/content-search.feature",
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
        headless: true,
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
