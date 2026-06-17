const path = require("path");
const { test, expect } = require("@playwright/test");
const { startLocalStack, stopLocalStack } = require("./stackContainers");
const { createPanDomainCookie } = require("./panDomainCookie");

test.describe("Local stack via Testcontainers", () => {
    test("starts MinIO first, injects its host/port into Restorer, then loads app", async ({
        page,
    }) => {
        const projectRoot = path.resolve(__dirname, "../..");
        let stack;

        const cookieData = createPanDomainCookie(projectRoot);

        try {
            stack = await startLocalStack(projectRoot);
            const { baseUrl } = stack;

            await page.context().addCookies([
                {
                    name: "gutoolsAuth-assym",
                    value: cookieData,
                    url: baseUrl,
                },
            ]);

            const response = await page.goto(baseUrl, {
                waitUntil: "domcontentloaded",
                timeout: 60 * 1000,
            });

            expect(
                response,
                "Expected a response from restorer service",
            ).not.toBeNull();
            expect(
                response.status(),
                "Expected restorer to avoid server error on startup route",
            ).toBeLessThan(500);
        } finally {
            await stopLocalStack(stack || {});
        }
    });
});
