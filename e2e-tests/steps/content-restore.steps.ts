import { Given, When, Then, After, expect } from "../fixtures";
import { createPanDomainCookie } from "../setup/panDomainCookie";
import { setLastApiResponse } from "./support/lastApiResponse";
import { resetMockState } from "./support/mockState";
import type { APIRequestContext, APIResponse, Page } from "@playwright/test";
import type { LocalStack } from "../setup/stackContainers";

/**
 * Playwright-style step definitions for `tests/features/content-restore.feature`.
 *
 * Each step receives the Playwright fixtures as the first argument
 * (e.g. `async ({ page }) => { ... }`) following the playwright-style approach:
 * https://vitalets.github.io/playwright-bdd/#/writing-steps/playwright-style
 *
 * UI assertions are driven by user-facing text (headings, labels, prose) rather
 * than CSS selectors.
 *
 * NOTE: Steps already defined in other step files are intentionally NOT
 * redefined here, because playwright-bdd shares step definitions across all step
 * files. The Background steps (`the application stack is running`,
 * `I am signed in through pan-domain auth`, `I have opened the version history
 * page for a piece of content`) and several restore steps
 * (`the restore modal is open`, `I should see source revision and source
 * timestamp details`, `the Restore Version action should be disabled/enabled`,
 * `I submit Restore Version successfully`, `the response should be not found`)
 * are reused from `content-search.steps.ts`,
 * `content-snapshot-content.steps.ts` and `export.steps.ts`.
 */

let timeout = 7 * 1000;

// After any @state-modifying scenario has run its final step (and made its
// assertions), reset the shared mock flexible-content API back to its defaults
// so the mutated per-content state cannot leak into later scenarios. These
// scenarios never overlap because the feature is tagged @mode:serial (runs on a
// single worker in order), so a plain reset is sufficient.
After({ tags: "@state-modifying" }, async ({ page, localStack }) => {
    await resetMockState(page.request, localStack.mockApiUrl);
});

// Holds the response from a restore API request so later Then steps can assert
// on its status/body.
let restoreResponse: APIResponse | undefined;

// Holds the restore destinations returned by the app so later Then steps can
// assert on their availability (populated when the restore modal loads).
let loadedDestinations: Array<{ systemId: string; available: boolean }> = [];

// Three fixtures (each has snapshots in the MinIO buckets so the version history
// page renders and the restore modal can open) used to exercise the three
// destination-row states. The mock flexible-content API is configured per
// content id (via `changeDetailsByContentId`) so each id's destinations report a
// different state:
//   - already has content  -> changeDetails returns a revision + last-modified
//   - has no content        -> changeDetails returns 200 with empty data
//   - cannot be used         -> changeDetails resets the connection so the
//                               destination is marked unavailable
const DESTINATION_CONTENT_IDS = {
    hasContent: "54931ae2e4b019234074e3c8",
    noContent: "569cdccee4b0e63c102ed861",
    cannotBeUsed: "58e4eab7e4b01ca21818a13e",
    // Used by the "a single destination stack cannot be reached" scenario: the
    // primary stack is made unreachable while the others still respond.
    singleStackDown: "54a2b86be4b048dfa4053a48",
} as const;

// The primary stack ("Composer (CODE)") reaches the mock under this hostname
// alias (see `tests/e2e/stackContainers.ts` and `app/models/FlexibleStack.scala`).
// The mock treats requests whose Host header contains this fragment as
// unreachable, so only the primary destination is marked unavailable.
const PRIMARY_STACK_HOST_FRAGMENT = "flexible-api.CODE.flexible.gudiscovery";
const PRIMARY_SYSTEM_ID = "CODE:flexible";


// Longest a destination list can take to load. Allow generous headroom so the
// assertion is not flaky under load.
const DESTINATIONS_LOAD_TIMEOUT = 25 * 1000;

// The Background content. Its fixtures are uploaded to both the primary and
// secondary snapshot buckets and the version list is sorted newest-first, so the
// active (most recent) snapshot resolves to the secondary stack. That makes the
// secondary stack the "current system" for this content (see
// `RestoreFormCtrl.loadSourceAndDestinations`, which preselects the destination
// whose systemId matches the active snapshot's system).
const BACKGROUND_CONTENT_ID = "568c4110e4b0c73bdb0e52df";
const CURRENT_SYSTEM_ID = "CODE:flexible-secondary";

/** Point the mock flexible-content API at a per-content changeDetails response. */
async function setDestinationChangeDetails(
    request: APIRequestContext,
    mockApiUrl: string,
    contentId: string,
    changeDetails: Record<string, unknown>,
): Promise<void> {
    await request.post(`${mockApiUrl}/__admin/state`, {
        data: { changeDetailsByContentId: { [contentId]: changeDetails } },
    });
}

/** Regex matching the restore destinations XHR the modal issues on open. */
const DESTINATIONS_URL = /\/api\/1\/restore\/destinations\//;

/**
 * Press Enter to open the restore modal and wait until its destination list has
 * finished loading.
 *
 * The "To:" heading is part of the modal template and appears immediately, but
 * the destination radios are rendered only after `RestoreFormCtrl` resolves the
 * user's permissions and the `/api/1/restore/destinations/:id` request. Keying
 * the wait to the settled response and the populated `<ol>` (rather than a short
 * fixed timeout) removes the load-sensitive flake where assertions ran before
 * the radios had rendered.
 */
async function openModalAndAwaitDestinations(page: Page): Promise<void> {
    await Promise.all([
        page.waitForResponse(
            (response) =>
                DESTINATIONS_URL.test(response.url()) &&
                response.status() === 200,
            { timeout: DESTINATIONS_LOAD_TIMEOUT },
        ),
        page.keyboard.press("Enter"),
    ]);
    await expect(
        page.getByRole("heading", { name: "To:" }),
    ).toBeVisible({ timeout: DESTINATIONS_LOAD_TIMEOUT });
    // The destination <ol> is populated with one radio per stack once the
    // request resolves; wait for the first before any per-row assertions run.
    await expect(
        page
            .locator("ol.modal__content__destination-list input[type=radio]")
            .first(),
    ).toBeVisible({ timeout: DESTINATIONS_LOAD_TIMEOUT });
}

/**
 * Locate a destination's radio input by the display name rendered in its list
 * row, rather than by the radio's computed accessible name.
 *
 * The radios are custom-styled (`-webkit-appearance: none` with a decorative
 * check span) and the unavailable destination is `disabled`. Resolving such a
 * radio via `getByRole("radio", { name })` proved flaky: the accessibility-name
 * lookup intermittently failed to match even though the row, its label text and
 * the disabled input were all present in the DOM. Matching the row by its
 * user-visible display name and then reading its `<input>` is deterministic
 * because it reads DOM text directly instead of the computed a11y name.
 */
function destinationRadioByName(page: Page, name: RegExp) {
    return page
        .locator("ol.modal__content__destination-list li")
        .filter({ has: page.getByText(name) })
        .locator('input[type="radio"]');
}

/** Open the version history page for a piece of content and launch the modal. */
async function openRestoreModalFor(
    page: Page,
    localStack: LocalStack,
    contentId: string,
): Promise<void> {
    await page.goto(`${localStack.baseUrl}/content/${contentId}/versions`, {
        waitUntil: "domcontentloaded",
    });
    // The "Show JSON" toggle only appears once a snapshot is active.
    await expect(
        page.getByText("Show JSON", { exact: true }),
    ).toBeVisible({ timeout: timeout });
    await openModalAndAwaitDestinations(page);
}

// --- The restore modal shows the source snapshot header and destination headings

Given(
    "a snapshot is active in the version history page",
    async ({ page }) => {
        // On load the version history page marks the most recent snapshot active
        // and renders its content panel. The "Show JSON" toggle only appears once
        // that content has loaded, so its presence confirms a snapshot is active.
        await expect(
            page.getByText("Show JSON", { exact: true }),
        ).toBeVisible({ timeout: timeout });
    },
);

When("I open the restore modal", async ({ page }) => {
    // With a snapshot active and the modal closed, the snapshot-list keydown
    // handler opens the restore modal on Enter (keyCode 13).
    await page.keyboard.press("Enter");
});

Then('I should see the "Before you restore" heading', async ({ page }) => {
    // The modal header renders "Before you restore" as its title heading.
    await expect(
        page.getByRole("heading", { name: "Before you restore" }),
    ).toBeVisible({ timeout: timeout });
});

Then('I should see the "From" and "To" headings', async ({ page }) => {
    // The modal lays out the source and destination columns under the "From:"
    // and "To:" headings.
    await expect(
        page.getByRole("heading", { name: "From:" }),
    ).toBeVisible({ timeout: timeout });
    await expect(
        page.getByRole("heading", { name: "To:" }),
    ).toBeVisible({ timeout: timeout });
});

// --- The restore modal shows the source as coming from secondary when appropriate

Given("the active snapshot is from a secondary system", async ({ page }) => {
    // The fixtures load identical snapshots into both the primary and secondary
    // snapshot buckets, and the version list is sorted newest-first. For the
    // Background content the most recent (active) snapshot resolves to the
    // secondary stack, so no extra selection is needed — just wait for the
    // content panel to be ready (the "Show JSON" toggle only appears once a
    // snapshot is active).
    await expect(
        page.getByText("Show JSON", { exact: true }),
    ).toBeVisible({ timeout: timeout });
});

Then(
    "I should see the source summary indicate that it is from secondary",
    async ({ page }) => {
        // The modal's source summary renders "Snapshot of revision N taken from
        // secondary at <date>" when the active snapshot's system is secondary
        // (the "from secondary" text is only present for secondary sources).
        await expect(
            page.getByText(/Snapshot of revision \d+ taken from secondary at/),
        ).toBeVisible({ timeout: DESTINATIONS_LOAD_TIMEOUT });
    },
);

// --- Destination choices are limited when I cannot restore to any stack -------

Given(
    "I do not have restore_content_to_any_stack permission",
    async ({ page, localStack }) => {
        // Reuse the existing `RestoreSingleStack` role
        // (restore.single.stack@guardian.co.uk), which the permissions fixture
        // grants `restore_content` but NOT `restore_content_to_any_stack`. Swap
        // the pan-domain cookie to that user and reload so the frontend picks up
        // the single-stack permission.
        const { baseUrl, panDomainPrivateKey } = localStack;
        const cookieData = createPanDomainCookie(
            panDomainPrivateKey,
            "RestoreSingleStack",
        );

        await page.context().addCookies([
            {
                name: "gutoolsAuth-assym",
                value: cookieData,
                url: baseUrl,
            },
        ]);

        await page.reload({ waitUntil: "domcontentloaded" });
    },
);

When("the restore modal loads destination choices", async ({ page }) => {
    // Wait for a snapshot to be active (the "Show JSON" toggle only appears once
    // content has loaded), then open the restore modal and wait for its
    // destination list to finish loading (see `openModalAndAwaitDestinations`).
    await expect(
        page.getByText("Show JSON", { exact: true }),
    ).toBeVisible({ timeout: timeout });
    await openModalAndAwaitDestinations(page);
});

Given("the restore modal has loaded destination choices with current system present", async ({ page, localStack }) => {
    // Open the Background content's restore modal with no interception: the
    // destinations endpoint returns every stack, so the active snapshot's system
    // (the secondary stack) is present in the list and can be preselected.
    await openRestoreModalFor(page, localStack, BACKGROUND_CONTENT_ID);
});

Then(
    "I should only see destinations for the current system",
    async ({ page }) => {
        // The active snapshot for the Background content is from the secondary
        // system, so the only destination the single-stack user may restore to
        // is "Composer-secondary (CODE)". Each destination renders as a radio
        // option labelled with its display name.
        await expect(
            page.getByRole("radio", { name: /Composer-secondary \(CODE\)/ }),
        ).toBeVisible({ timeout: timeout });
    },
);

Then("I should not see destinations from other stacks", async ({ page }) => {
    // The other stacks (the primary "Composer (CODE)" and the local
    // "Local Flexible Content") must be filtered out because the user cannot
    // restore across stacks.
    await expect(
        page.getByRole("radio", { name: /Composer \(CODE\)/ }),
    ).toHaveCount(0);
    await expect(
        page.getByRole("radio", { name: /Local Flexible Content/ }),
    ).toHaveCount(0);
});

// --- Destination choices include all available stacks when I have permission --

Given(
    "I have restore_content_to_any_stack permission",
    async ({ page, localStack }) => {
        // The default user (composer.application@guardian.co.uk) is granted
        // `restore_content_to_any_stack` by the permissions fixture. Signing in
        // as that default role and reloading ensures the frontend has the
        // cross-stack permission for this scenario.
        const { baseUrl, panDomainPrivateKey } = localStack;
        const cookieData = createPanDomainCookie(panDomainPrivateKey);

        await page.context().addCookies([
            {
                name: "gutoolsAuth-assym",
                value: cookieData,
                url: baseUrl,
            },
        ]);

        await page.reload({ waitUntil: "domcontentloaded" });
    },
);

Then("I should see every available restore destination", async ({ page }) => {
    // With the cross-stack permission the destination list is unfiltered, so
    // every configured stack is offered: the primary "Composer (CODE)", the
    // secondary "Composer-secondary (CODE)" and the local "Local Flexible
    // Content". Each renders as a radio option labelled with its display name.
    await expect(
        page.getByRole("radio", { name: /Composer \(CODE\)/ }),
    ).toBeVisible({ timeout: timeout });
    await expect(
        page.getByRole("radio", { name: /Composer-secondary \(CODE\)/ }),
    ).toBeVisible({ timeout: timeout });
    await expect(
        page.getByRole("radio", { name: /Local Flexible Content/ }),
    ).toBeVisible({ timeout: timeout });
});

Then(
    "the destination list should not be restricted to the current system",
    async ({ page }) => {
        // The active snapshot is from the secondary system, so if the list were
        // restricted only "Composer-secondary (CODE)" would show. Seeing all
        // three configured stacks proves the list is not restricted to the
        // current system.
        await expect(page.getByRole("radio")).toHaveCount(3);
    },
);

// --- Each destination row explains whether content is already present ---------

Given(
    "the restore modal has loaded destination choices when the destination already has content",
    async ({ page, localStack }) => {
        // Configure the mock so this content's destinations report a current
        // revision, which the modal renders as "currently has revision N, last
        // modified at ...".
        await setDestinationChangeDetails(
            page.request,
            localStack.mockApiUrl,
            DESTINATION_CONTENT_IDS.hasContent,
            { status: 200, revision: 38, lastModified: 1781234474425 },
        );
        await openRestoreModalFor(
            page,
            localStack,
            DESTINATION_CONTENT_IDS.hasContent,
        );
    },
);

Given(
    "the restore modal has loaded destination choices when the destination has no content",
    async ({ page, localStack }) => {
        // Configure the mock so this content's destinations return a 200 with no
        // change details, which the modal renders as "content not on this
        // instance".
        await setDestinationChangeDetails(
            page.request,
            localStack.mockApiUrl,
            DESTINATION_CONTENT_IDS.noContent,
            { status: 200, revision: null, lastModified: null },
        );
        await openRestoreModalFor(
            page,
            localStack,
            DESTINATION_CONTENT_IDS.noContent,
        );
    },
);

Given(
    "the restore modal has loaded destination choices when the destination cannot be used",
    async ({ page, localStack }) => {
        // Configure the mock so this content's destinations reset the connection,
        // which the restorer treats as an unreachable stack and marks the
        // destinations unavailable so they cannot be used.
        await setDestinationChangeDetails(
            page.request,
            localStack.mockApiUrl,
            DESTINATION_CONTENT_IDS.cannotBeUsed,
            { unreachable: true },
        );
        await openRestoreModalFor(
            page,
            localStack,
            DESTINATION_CONTENT_IDS.cannotBeUsed,
        );
    },
);

When("I inspect the destination list", async ({ page }) => {
    // Wait for the destination choices to finish loading and render as radio
    // options. The "cannot be used" case queries each stack sequentially and
    // times out, so allow generous headroom.
    await expect(
        page.getByRole("radio").first(),
    ).toBeVisible({ timeout: DESTINATIONS_LOAD_TIMEOUT });
});

Then('I should see "content not on this instance"', async ({ page }) => {
    // An available destination with no current content renders this message.
    await expect(
        page.getByText("content not on this instance").first(),
    ).toBeVisible({ timeout: timeout });
});

Then(
    "I should see a revision summary that already has content",
    async ({ page }) => {
        // A destination that already has content renders "currently has revision
        // N, last modified at <date>".
        await expect(
            page
                .getByRole("radio", {
                    name: /currently has revision \d+, last modified at/,
                })
                .first(),
        ).toBeVisible({ timeout: timeout });
    },
);

Then(
    'I should see "content not on this instance" when the destination is available but empty',
    async () => {
        // TODO: implement step
    },
);

Then(
    "I should see no extra message when the destination cannot be used",
    async ({ page }) => {
        // A destination that cannot be reached is offered as a disabled radio
        // with no change summary, so neither the "currently has revision" nor the
        // "content not on this instance" message is shown.
        await expect(
            page.getByRole("radio").first(),
        ).toBeDisabled({ timeout: timeout });
        await expect(page.getByText(/currently has revision/)).toHaveCount(0);
        await expect(page.getByText("content not on this instance")).toHaveCount(
            0,
        );
    },
);

// --- A destination is marked unavailable when its stack cannot be reached ------

Given(
    "one destination stack does not respond within the timeout",
    async ({ page, localStack }) => {
        // Make only the primary stack unreachable (matched by its hostname) while
        // the other stacks return a normal revision. The restorer's call to the
        // primary stack fails fast and that destination is returned as
        // unavailable, leaving the others available.
        await setDestinationChangeDetails(
            page.request,
            localStack.mockApiUrl,
            DESTINATION_CONTENT_IDS.singleStackDown,
            {
                status: 200,
                revision: 42,
                lastModified: 1781234474425,
                unreachableHosts: [PRIMARY_STACK_HOST_FRAGMENT],
            },
        );
    },
);

When(
    "the restore modal loads destination choices for that content",
    async ({ page, localStack }) => {
        // Capture the destinations the app returns (the modal requests them when
        // it opens) so the next step can assert on their availability.
        const destinationsResponse = page.waitForResponse((response) =>
            /\/api\/1\/restore\/destinations\//.test(response.url()),
        );
        await openRestoreModalFor(
            page,
            localStack,
            DESTINATION_CONTENT_IDS.singleStackDown,
        );
        const response = await destinationsResponse;
        loadedDestinations = (await response.json()) as Array<{
            systemId: string;
            available: boolean;
        }>;
    },
);

Then("that destination should be returned as unavailable", async () => {
    // The unreachable primary stack is returned with `available: false`, while
    // the reachable stacks are still available.
    const primary = loadedDestinations.find(
        (destination) => destination.systemId === PRIMARY_SYSTEM_ID,
    );
    expect(primary, "primary destination should be present").toBeDefined();
    expect(primary!.available).toBe(false);
    const others = loadedDestinations.filter(
        (destination) => destination.systemId !== PRIMARY_SYSTEM_ID,
    );
    expect(others.length).toBeGreaterThan(0);
    expect(others.every((destination) => destination.available)).toBe(true);
});

Then(
    "its selection option should be disabled in the destination list",
    async ({ page }) => {
        // The unavailable primary destination is rendered as a disabled radio,
        // while the reachable destinations remain selectable.
        await expect(
            destinationRadioByName(page, /Composer \(CODE\)/),
        ).toBeDisabled({ timeout: DESTINATIONS_LOAD_TIMEOUT });
        await expect(
            destinationRadioByName(page, /Composer-secondary \(CODE\)/),
        ).toBeEnabled({ timeout: DESTINATIONS_LOAD_TIMEOUT });
    },
);

// --- The current destination is preselected when it is available --------------

When("the modal finishes loading", async ({ page }) => {
    // The modal has finished loading once its destination choices have rendered
    // as radio options.
    await expect(
        page.getByRole("radio").first(),
    ).toBeVisible({ timeout: DESTINATIONS_LOAD_TIMEOUT });
});

Then("the current system destination should be preselected", async ({ page }) => {
    // The active snapshot's system (the secondary stack) is present in the
    // destination list, so it is the one preselected (its radio is checked).
    await expect(
        page.getByRole("radio", { name: /Composer-secondary \(CODE\)/ }),
    ).toBeChecked({ timeout: timeout });
});

// --- The first available destination is used when the current system is missing

Given(
    "the restore modal has loaded destination choices with current system missing",
    async ({ page, localStack }) => {
        // Remove the active snapshot's system (the secondary stack) from the
        // destinations response so the current system is absent from the list.
        // The interception must be registered before the modal opens and fires
        // its destinations request.
        await page.route(
            "**/api/1/restore/destinations/*",
            async (route) => {
                const response = await route.fetch();
                const destinations = (await response.json()) as Array<{
                    systemId: string;
                }>;
                const withoutCurrentSystem = destinations.filter(
                    (destination) => destination.systemId !== CURRENT_SYSTEM_ID,
                );
                await route.fulfill({ response, json: withoutCurrentSystem });
            },
        );
        await openRestoreModalFor(page, localStack, BACKGROUND_CONTENT_ID);
    },
);

Then("the first destination should be preselected", async ({ page }) => {
    // With the current system removed, the modal falls back to preselecting the
    // first destination in the list (the primary "Composer (CODE)" stack).
    await expect(
        page.getByRole("radio").first(),
    ).toBeChecked({ timeout: timeout });
    // Confirm the "missing" precondition held: the current (secondary) system is
    // not offered as a destination.
    await expect(
        page.getByRole("radio", { name: /Composer-secondary \(CODE\)/ }),
    ).toHaveCount(0);
});

// --- The Restore Version action stays disabled until both safety checks -------

When("either safety checkbox is not selected", async ({ page }) => {
    // Select only one of the two required safety checkboxes ("You are not in
    // content"), leaving the other ("No one else is in the content") unchecked
    // so the "either not selected" condition holds.
    await page.getByLabel("You are not in content").check();
});

When("both safety checkboxes are selected", async ({ page }) => {
    // Tick both safety checkboxes so the Restore Version button's `ng-disabled`
    // condition clears.
    await page.getByLabel("You are not in content").check();
    await page.getByLabel("No one else is in the content").check();
});

// --- Closing the modal resets the restore form back to its initial state ------

Given("I choose a destination and select the safety checkboxes", async ({ page }) => { 
    await page.getByRole('radio', { name: '✓ Composer (CODE) currently' }).check();
    await page.getByRole('checkbox', { name: '✓ You are not in content' }).check();
    await page.getByRole('checkbox', { name: '✓ No one else is in the' }).check();
});

When("I close the modal with Cancel", async ({ page }) => {
    await page.getByRole('button', { name: 'Cancel' }).click();
});

Then("the modal should close", async ({ page }) => {
    // The modal is only ever hidden by toggling its opacity to 0 (it keeps its
    // DOM node and layout), so a closed modal is detected by its computed
    // opacity rather than by visibility. Locate it by its unique title text.
    await expect(
        page.locator(".modal").filter({ hasText: "Before you restore" }),
    ).toHaveCSS("opacity", "0", { timeout: timeout });
});

Then("the destination list should be cleared", async ({ page }) => {
    await expect(page.getByRole('radio', { name: /Composer \(CODE\)/ })).not.toBeChecked();
});

Then("the safety checkboxes should reset", async ({ page }) => {
    await expect(page.getByRole('checkbox', { name: /You are not in content/ })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: /No one else is in the/ })).not.toBeChecked();
});


// --- Pressing Escape closes the restore modal ---------------------------------

When("I press Escape", async ({ page }) => {
    // While the modal is active the modal controller closes it on Escape
    // (keyCode 27).
    await page.keyboard.press("Escape");
});

Then(
    "the page should return to the version history view",
    async ({ page }) => {
        // Closing the modal leaves the user on the version history page, so its
        // URL and content remain in view. Assert both the URL and a known piece
        // of the version history content.
        await expect(page).toHaveURL(/\/content\/[^/]+\/versions/);
        await expect(
            page.getByRole("heading", {
                name: "Irish fury at Thierry Henry's handball in World Cup qualifier",
            }),
        ).toBeVisible({ timeout: timeout });
    },
);

// --- A restore request is rejected when I lack restore_content permission ------

Given("I do not have restore_content permission", async ({ page, localStack }) => {
    // Sign in as the `RestorerAccessOnly` role
    // (restorer.access.only@guardian.co.uk). The permissions fixture grants that
    // user `restorer_access` (so it passes auth and reaches the controller) but
    // not `restore_content`.
    const { baseUrl, panDomainPrivateKey } = localStack;
    const cookieData = createPanDomainCookie(
        panDomainPrivateKey,
        "RestorerAccessOnly",
    );

    await page.context().addCookies([
        {
            name: "gutoolsAuth-assym",
            value: cookieData,
            url: baseUrl,
        },
    ]);
});

When("I submit a restore request to the restore API", async ({ page, localStack }) => {
    // POST to the restore endpoint. The controller checks `restore_content`
    // before anything else, so a same-stack request (source == destination) is
    // enough to trigger the rejection and the content/timestamp are irrelevant.
    const systemId = "CODE:flexible";
    const contentId = "568c4110e4b0c73bdb0e52df";
    const timestamp = "2026-06-12T03:26:06.505Z";

    const url =
        `${localStack.baseUrl}/api/1/restore/` +
        `${encodeURIComponent(systemId)}/${contentId}/` +
        `${encodeURIComponent(timestamp)}/to/` +
        `${encodeURIComponent(systemId)}`;

    restoreResponse = await page.request.post(url);
});

Then("the request should be rejected as forbidden", async () => {
    // A rejected restore request returns HTTP 403 Forbidden.
    expect(restoreResponse).toBeDefined();
    expect(restoreResponse!.status()).toBe(403);
});

Then(
    "I should be told that the restore_content permission is required",
    async () => {
        // The controller responds with a message naming the missing permission.
        // The cross-stack message reads "restore_content_to_any_stack
        // permission", so match the specific "restore_content permission"
        // phrase to be sure this is the restore_content rejection.
        expect(restoreResponse).toBeDefined();
        const body = await restoreResponse!.text();
        expect(body).toContain("restore_content permission");
    },
);

// --- Restoring to a different stack is rejected without cross-stack permission -

Given("I have restore_content permission", async ({ page, localStack }) => {
    // Reuse the existing `RestoreSingleStack` role
    // (restore.single.stack@guardian.co.uk), which the permissions fixture
    // grants `restore_content` (but NOT `restore_content_to_any_stack`). Swap
    // the pan-domain cookie to that user so the restore API request is made as
    // someone who may restore to their own stack only.
    const { baseUrl, panDomainPrivateKey } = localStack;
    const cookieData = createPanDomainCookie(
        panDomainPrivateKey,
        "RestoreSingleStack",
    );

    await page.context().addCookies([
        {
            name: "gutoolsAuth-assym",
            value: cookieData,
            url: baseUrl,
        },
    ]);
});

When(
    "I submit a restore request whose destination stack differs from the source stack",
    async ({ page, localStack }) => {
        // POST to the restore endpoint with a source stack id that differs from
        // the destination stack id. The controller checks the cross-stack
        // permission before it looks up any snapshot, so the exact
        // content/timestamp values are irrelevant to this rejection.
        const sourceId = "CODE:flexible";
        const destinationId = "CODE:flexible-secondary";
        const contentId = "568c4110e4b0c73bdb0e52df";
        const timestamp = "2026-06-12T03:26:06.505Z";

        const url =
            `${localStack.baseUrl}/api/1/restore/` +
            `${encodeURIComponent(sourceId)}/${contentId}/` +
            `${encodeURIComponent(timestamp)}/to/` +
            `${encodeURIComponent(destinationId)}`;

        restoreResponse = await page.request.post(url);
    },
);

Then(
    "I should be told that the restore_content_to_any_stack permission is required",
    async () => {
        // The controller responds with a message naming the missing permission.
        expect(restoreResponse).toBeDefined();
        const body = await restoreResponse!.text();
        expect(body).toContain("restore_content_to_any_stack");
    },
);

// --- Restoring a snapshot that is missing from the source returns not found ----

Given("I have the required restore permissions", async ({ page, localStack }) => {
    // Sign in as the default user (composer.application@guardian.co.uk), which
    // the permissions fixture grants both `restore_content` and
    // `restore_content_to_any_stack`, so the request reaches the snapshot lookup
    // rather than being rejected on permissions.
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

When(
    "I submit a restore request for a snapshot that no longer exists in the source stack",
    async ({ page, localStack }) => {
        // A well-formed request for an existing content id but a timestamp that
        // has no snapshot fixture in the source bucket. The controller's snapshot
        // lookup returns None, so it responds NotFound (see
        // app/controllers/Restore.scala). Source and destination are the same
        // stack so only `restore_content` is exercised.
        const systemId = "CODE:flexible";
        const contentId = "568c4110e4b0c73bdb0e52df";
        const timestamp = "2000-01-01T00:00:00.000Z";

        const url =
            `${localStack.baseUrl}/api/1/restore/` +
            `${encodeURIComponent(systemId)}/${contentId}/` +
            `${encodeURIComponent(timestamp)}/to/` +
            `${encodeURIComponent(systemId)}`;

        restoreResponse = await page.request.post(url);
        setLastApiResponse(restoreResponse);
    },
);
