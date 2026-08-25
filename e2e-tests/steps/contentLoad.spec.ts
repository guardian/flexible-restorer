import path from "path";
import { test, expect } from "@playwright/test";
import { startLocalStack, stopLocalStack, type LocalStack } from "../setup/stackContainers";

test.describe("Local stack via Testcontainers", () => {
    test("starts MinIO first, injects its host/port into Restorer, then loads app", async ({
        page,
    }) => {
        test.setTimeout(120 * 1000);

        const projectRoot = path.resolve(__dirname, "../..");
        let stack: LocalStack | undefined;

        try {
            stack = await startLocalStack(projectRoot);
            const { baseUrl, cookieUrl } = stack;

            // Hitting the nginx /cookie endpoint sets the prebaked pan-domain
            // auth cookie and redirects to the app, replacing the previous
            // approach of injecting a cookie into the browser context.
            const response = await page.goto(cookieUrl, {
                waitUntil: "domcontentloaded",
                timeout: 60 * 1000,
            });

            expect(
                response,
                "Expected a response from restorer service",
            ).not.toBeNull();
            expect(
                page.url(),
                "Expected /cookie to redirect to the app root",
            ).toBe(`${baseUrl}/`);
            expect(
                response.status(),
                "Expected restorer to avoid server error on startup route",
            ).toBeLessThan(500);

            let composerUrlInput = page.getByLabel("Enter a composer url:");

            await expect(composerUrlInput).toBeVisible({
                timeout: 5 * 1000,
            });

            await composerUrlInput.fill("568c4110e4b0c73bdb0e52df");
            await expect(composerUrlInput).toHaveValue(
                "568c4110e4b0c73bdb0e52df",
            );

            const searchButton = page.getByRole("button", { name: "Search" });
            await expect(searchButton).toBeEnabled();
            await searchButton.click();

            await expect(
                page
                    .getByRole("heading", {
                        name: /Irish fury at Thierry Henry/i,
                    })
                    .first(),
            ).toBeVisible({ timeout: 5 * 1000 });
        } finally {
            await stopLocalStack(stack);
        }
    });
});
