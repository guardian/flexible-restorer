const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
    testDir: "./tests/e2e",
    timeout: 15 * 60 * 1000,
    expect: {
        timeout: 60 * 1000,
    },
    retries: 0,
    reporter: [["list"]],
    use: {
        headless: true,
        trace: "on",
        video: "on",
        screenshot: "only-on-failure",
    },
});
