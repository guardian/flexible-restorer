import type { APIRequestContext } from "@playwright/test";
import { When, Then, expect } from "../fixtures";
import { createPanDomainCookie, type Role } from "../setup/panDomainCookie";

/**
 * Playwright-style step definitions for `tests/features/authentication.feature`.
 *
 * Each step receives the Playwright fixtures as the first argument
 * (e.g. `async ({ page }) => { ... }`) following the playwright-style approach:
 * https://vitalets.github.io/playwright-bdd/#/writing-steps/playwright-style
 *
 * The custom fixtures in `../fixtures` boot (or reuse) the local stack.
 *
 * NOTE: Steps that already exist in other step files are intentionally NOT
 * redefined here, because playwright-bdd shares step definitions across all step
 * files. The Background step `the application stack is running` and the sign-in
 * step `I am signed in through pan-domain auth` are reused from
 * `content-search.steps.ts`. The global `Before({ tags: "@pending" })` skip hook
 * is also registered there and applies to every `@pending` scenario, including
 * the not-yet-implemented scenarios in this feature.
 */

let timeout = 5 * 1000;

// --- A protected page is only available to signed-in users with restorer access

// A *truly anonymous* request (no pan-domain cookie) is redirected to Google
// OAuth, not to the access-denied page. The access-denied page is the
// `showUnauthedMessage` path in `app/auth/PanDomainAuthActions.scala`, which is
// only reached when a request carries a valid Guardian pan-domain session whose
// user fails `validateUser` — i.e. a signed-in user who lacks `restorer_access`.
// This is modelled with the `NoRestoreAccess` user (`no.restore@guardian.co.uk`),
// who is signed in but is denied the restorer.
When(
    "I request the restorer homepage signed in without restorer access",
    async ({ page, localStack }) => {
        const { baseUrl, panDomainPrivateKey } = localStack;

        await page.context().addCookies([
            {
                name: "gutoolsAuth-assym",
                value: createPanDomainCookie(panDomainPrivateKey, "NoRestoreAccess"),
                url: baseUrl,
            },
        ]);

        // Requesting the protected homepage triggers a 303 redirect to the
        // access-denied page, which Playwright follows automatically.
        await page.goto(baseUrl + "/", { waitUntil: "domcontentloaded" });
    },
);

Then("I am redirected to the access denied page", async ({ page }) => {
    // The auth gate redirects unauthorised users to `controllers.Login.authError`,
    // served at `/authError`.
    await expect.poll(() => page.url(), { timeout: timeout }).toContain("/authError");
});

Then(
    "the page title should say Composer Restorer - Access denied",
    async ({ page }) => {
        // The `<title>` of `app/views/authError.scala.html`.
        await expect(page).toHaveTitle("Composer Restorer - Access denied", {
            timeout: timeout,
        });
    },
);

Then(
    "the page should explain how to contact Central Production for help",
    async ({ page }) => {
        // The access-denied page directs users to Central Production via a
        // `mailto:` link to request access or a restore.
        const contactLink = page.getByRole("link", { name: "Central Production" });
        await expect(contactLink).toBeVisible({ timeout: timeout });
        await expect(contactLink).toHaveAttribute(
            "href",
            "mailto:central.production@guardian.co.uk",
        );
    },
);

// --- The access denied page shows the message returned by auth ----------------

// The auth layer renders the access-denied page via `controllers.Login.authError`,
// which passes its `message` query parameter straight into `authError.scala.html`
// (`<p>@message</p>`). The route is a plain (unauthenticated) action, so we can
// drive it directly with a representative failure message and assert it is shown.
let authMessage: string;

When("authentication fails with a message", async ({ page, localStack }) => {
    authMessage = "Your Guardian account is not permitted to use the restorer";

    await page.goto(
        localStack.baseUrl + "/authError?message=" + encodeURIComponent(authMessage),
        { waitUntil: "domcontentloaded" },
    );
});

Then("the access denied page should display that message", async ({ page }) => {
    // The page renders the message the auth layer supplied.
    await expect(page.getByText(authMessage)).toBeVisible({ timeout: timeout });
});

Then(
    "the page should keep the Central Production contact link visible",
    async ({ page }) => {
        const contactLink = page.getByRole("link", { name: "Central Production" });
        await expect(contactLink).toBeVisible({ timeout: timeout });
        await expect(contactLink).toHaveAttribute(
            "href",
            "mailto:central.production@guardian.co.uk",
        );
    },
);

// --- The app exposes the current signed-in user ------------------------------

// The frontend's `UserService` fetches `/api/1/user` and `/api/1/user/permissions`
// (see `public/javascripts/app/services/UserService.js`). Both are served by
// `controllers.Login` behind the auth gate, so the requests reuse the signed-in
// session set up by `I am signed in through pan-domain auth` (the cookie is added
// to the browser context, which `page.request` shares).
let userDetails: { firstName?: string; lastName?: string; email?: string };
let permissionMap: Record<string, boolean>;

When("the frontend requests the current user", async ({ page, localStack }) => {
    const response = await page.request.get(localStack.baseUrl + "/api/1/user");
    expect(response.ok()).toBeTruthy();
    userDetails = await response.json();
});

Then("the API should return the current user details as JSON", async () => {
    // `request.user.toJson` returns the signed-in user's name and email.
    expect(userDetails).toMatchObject({
        firstName: "Playwright",
        lastName: "Tester",
        email: "composer.application@guardian.co.uk",
    });
});

// --- The app exposes the current user permissions ----------------------------

When(
    "the frontend requests the current user permissions",
    async ({ page, localStack }) => {
        const response = await page.request.get(
            localStack.baseUrl + "/api/1/user/permissions",
        );
        expect(response.ok()).toBeTruthy();
        permissionMap = await response.json();
    },
);

Then("the API should return the permission map as JSON", async () => {
    expect(permissionMap).toEqual(expect.any(Object));
});

Then(
    "the permission map should include whether I have restore_content permission",
    async () => {
        // `Permissions.all` includes `restore_content`, so the map reports it.
        expect(permissionMap).toHaveProperty("restore_content");
        expect(typeof permissionMap.restore_content).toBe("boolean");
    },
);

Then(
    "the permission map should include whether I have restore_content_to_any_stack permission",
    async () => {
        expect(permissionMap).toHaveProperty("restore_content_to_any_stack");
        expect(typeof permissionMap.restore_content_to_any_stack).toBe("boolean");
    },
);

Then(
    "the permission map should not include the restorer_access gate permission",
    async () => {
        // `restorer_access` is the access gate and is deliberately excluded from
        // `Permissions.all`, so it never appears in the map exposed to the client.
        expect(permissionMap).not.toHaveProperty("restorer_access");
    },
);

// --- Protected routes use the same auth gate as the main app -----------------

// All protected controllers (Application, Versions, Export, Restore) extend the
// same `PanDomainAuthActions`, so every protected route shares one gate: a user
// with `restorer_access` is served the route (200), while a user without it is
// redirected to the access-denied page (303 -> /authError) — exactly as for the
// main app homepage. Each route in the Scenario Outline is driven directly with
// each user's cookie via an isolated `request` context (so no page cookie
// interferes) without following redirects, to observe the gate's raw response.
let protectedRoutePath: string;

function requestRouteAs(
    request: APIRequestContext,
    baseUrl: string,
    privateKey: string,
    role: Role,
) {
    const cookie = createPanDomainCookie(privateKey, role);
    return request.get(baseUrl + protectedRoutePath, {
        headers: { Cookie: `gutoolsAuth-assym=${cookie}` },
        maxRedirects: 0,
    });
}

When(/^I open the protected route (.+)$/, async ({}, route: string) => {
    protectedRoutePath = route;
});

Then(
    "I should be allowed through with restorer access",
    async ({ request, localStack }) => {
        const response = await requestRouteAs(
            request,
            localStack.baseUrl,
            localStack.panDomainPrivateKey,
            "default",
        );
        // A user with restorer_access is served the route directly.
        expect(response.status()).toBe(200);
    },
);

Then(
    "I should be blocked without restorer access",
    async ({ request, localStack }) => {
        const response = await requestRouteAs(
            request,
            localStack.baseUrl,
            localStack.panDomainPrivateKey,
            "NoRestoreAccess",
        );
        // A user without restorer_access is redirected to the access-denied page.
        expect(response.status()).toBe(303);
        expect(response.headers()["location"]).toContain("/authError");
    },
);
