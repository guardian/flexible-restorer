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

let timeout = 4 * 1000; // 4 seconds

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
        timeout: timeout,
    });

    await composerUrlInput.fill("https://composer.code.dev-gutools.co.uk/content/568c4110e4b0c73bdb0e52df");
    await expect(composerUrlInput).toHaveValue(
        "https://composer.code.dev-gutools.co.uk/content/568c4110e4b0c73bdb0e52df",
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

When("I submit a content id value in the search form", async ({ page }) => {
    page.getByLabel("Enter a composer url:");
    let composerUrlInput = page.getByLabel("Enter a composer url:");

    await expect(composerUrlInput).toBeVisible({
        timeout: timeout,
    });

    await composerUrlInput.fill("568c4110e4b0c73bdb0e52df");
    await expect(composerUrlInput).toHaveValue(
        "568c4110e4b0c73bdb0e52df",
    );

    const searchButton = page.getByRole("button", { name: "Search" });
    await expect(searchButton).toBeEnabled();
    await searchButton.click();
});
// TODO: Should we enumerate more 
Then(
    "I should be taken to the version history route for that content id",
    async ({ page }) => {
        await expect(
            page
                .getByRole("heading", {
                    name: /Irish fury at Thierry Henry/i,
                })
                .first(),
        ).toBeVisible({ timeout: timeout });
    },
);

// --- Final path segment from a longer URL -------------------------------------

When("I submit a URL with multiple path segments", async () => {
    // TODO: implement step
});

Then(
    "I should be taken to the version history route using the final segment as the content id",
    async ({ page }) => {
        await expect(
            page
                .getByRole("heading", {
                    name: /Irish fury at Thierry Henry/i,
                })
                .first(),
        ).toBeVisible({ timeout: timeout });
    },
);

// --- Search cannot be submitted while the query is empty ----------------------

When("the query input is empty", async ({ page }) => {
    const composerUrlInput = page.getByLabel("Enter a composer url:");
    await expect(composerUrlInput).toBeVisible({
        timeout: timeout,
    });
    await composerUrlInput.fill("");
});

Then("the Search button should be disabled", async ({ page }) => {
    const searchButton = page.getByRole("button", { name: "Search" });
    await expect(searchButton).toBeDisabled();
});

Then("the form should require a query value", async ({ page }) => {
    const composerUrlInput = page.getByLabel("Enter a composer url:");
    await expect(composerUrlInput).toBeVisible({
        timeout: timeout,
    });
    // The input is rendered by react-aria, which serialises the boolean `required`
    // attribute as `required=""` (not `required="required"`). Assert the DOM
    // property so the check is robust to how the attribute is serialised.
    await expect(composerUrlInput).toHaveJSProperty("required", true);
});

// --- Trailing slash produces an empty hash segment ----------------------------

When("I submit a URL that ends with a trailing slash", async ({ page }) => {
    page.getByLabel("Enter a composer url:");
    let composerUrlInput = page.getByLabel("Enter a composer url:");

    await expect(composerUrlInput).toBeVisible({
        timeout: timeout,
    });

    await composerUrlInput.fill("https://composer.code.dev-gutools.co.uk/content/568c4110e4b0c73bdb0e52df/");
    await expect(composerUrlInput).toHaveValue(
        "https://composer.code.dev-gutools.co.uk/content/568c4110e4b0c73bdb0e52df/",
    );

    const searchButton = page.getByRole("button", { name: "Search" });
    await expect(searchButton).toBeEnabled();
    await searchButton.click();
});

Then("navigation should be built from the final path segment", async ({ page }) => {
    const url = page.url();
    expect(url).toContain("content//version");
});

Then(
    "the resulting version history route can contain an empty content id segment",
    async ({ page }) => {
        const url = page.url();
        expect(url).toContain("content//version");
    },
);

// --- Error when no snapshots exist --------------------------------------------

When("I submit a content id that has no snapshots", async ({ page }) => {
   page.getByLabel("Enter a composer url:");
    let composerUrlInput = page.getByLabel("Enter a composer url:");

    await expect(composerUrlInput).toBeVisible({
        timeout: timeout,
    });

    await composerUrlInput.fill("https://composer.code.dev-gutools.co.uk/content/missingId");
    await expect(composerUrlInput).toHaveValue(
        "https://composer.code.dev-gutools.co.uk/content/missingId",
    );

    const searchButton = page.getByRole("button", { name: "Search" });
    await expect(searchButton).toBeEnabled();
    await searchButton.click();
});

Then(
    "I should see an error message that no snapshots are available for that piece of content",
    async ({ page }) => {
        const errorMessage = page.getByText("There are no snapshots available for this piece of content");
        await expect(errorMessage).toBeVisible();
    },
);
