import { Before, Given, When, Then, expect } from "../fixtures";
import { createPanDomainCookie } from "../panDomainCookie";
/**
 * Playwright-style step definitions for
 * `tests/features/content-search.feature`.
 *
 * These are stubs only — no implementations yet. Each step receives the
 * Playwright fixtures as the first argument (e.g. `async ({ page }) => { ... }`)
 * following the playwright-style approach:
 * https://vitalets.github.io/playwright-bdd/#/writing-steps/playwright-style
 *
 * The custom fixtures in `../fixtures` boot the local stack and provide a
 * signed-in `page` (and `baseURL`) for the steps to use.
 */

// The steps are not implemented yet, so mark every scenario in this feature as
// pending (skipped). This runs before any step, so the local stack is never
// booted for these scenarios. Remove this hook once the steps are implemented.
Before({ tags: "@pending" }, async ({ $test }) => {
    $test.skip(true, "content-search steps are not implemented yet");
});

// --- Background ---------------------------------------------------------------

Given("the application stack is running", async () => {
    // This is handled by the `localStack` fixture in `../fixtures`, so no action is needed here.
});

Given("I am signed in through pan-domain auth", async ({ page, localStack }) => {
    const { baseUrl, panDomainPrivateKey } = localStack;
    const cookieData = createPanDomainCookie(panDomainPrivateKey);

    await page.context().addCookies([
        {
            name: "gutoolsAuth-assym",
            value: cookieData,
            url: baseUrl,
        },
    ]);
});

// --- Shared scenario context --------------------------------------------------

Given("I am an editor recovering and reviewing content", async () => {
    // This is handled by the `localStack` fixture in `../fixtures`, so no action is needed here.
});

Given("I am using the splash screen search page", async ({ page, localStack }) => {
    await page.goto(localStack.baseUrl , { waitUntil: "domcontentloaded" });
});

// --- Find version history from a valid Composer URL ---------------------------

When("I submit a valid Content API URL in the search form", async ({ page}) => {
    page.getByLabel("Enter a composer url:");
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
});

Then(
    "I should see the content version history for that Content API URL",
    async ({ page }) => {
        await expect(
            page
                .getByRole("heading", {
                    name: /Irish fury at Thierry Henry/i,
                })
                .first(),
        ).toBeVisible({ timeout: 5 * 1000 });
    },
);

// --- Find version history by entering only a content id -----------------------

When("I submit a content id value in the search form", async () => {
    // TODO: implement step
});

Then(
    "I should be taken to the version history route for that content id",
    async () => {
        // TODO: implement step
    },
);

// --- Final path segment from a longer URL -------------------------------------

When("I submit a URL with multiple path segments", async () => {
    // TODO: implement step
});

Then(
    "I should be taken to the version history route using the final segment as the content id",
    async () => {
        // TODO: implement step
    },
);

// --- Search cannot be submitted while the query is empty ----------------------

When("the query input is empty", async () => {
    // TODO: implement step
});

Then("the Search button should be disabled", async () => {
    // TODO: implement step
});

Then("the form should require a query value", async () => {
    // TODO: implement step
});

// --- Trailing slash produces an empty hash segment ----------------------------

When("I submit a URL that ends with a trailing slash", async () => {
    // TODO: implement step
});

Then("navigation should be built from the final path segment", async () => {
    // TODO: implement step
});

Then(
    "the resulting version history route can contain an empty content id segment",
    async () => {
        // TODO: implement step
    },
);

// --- Error when no snapshots exist --------------------------------------------

When("I submit a content id that has no snapshots", async () => {
    // TODO: implement step
});

Then(
    "I should see an error message that no snapshots are available for that piece of content",
    async () => {
        // TODO: implement step
    },
);
