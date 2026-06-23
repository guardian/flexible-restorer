import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { BddWorld } from "../support/world";

type VersionListWorld = BddWorld & {
    versionListDelayHooked?: boolean;
    versionListRequestSeen?: Promise<void>;
    resolveVersionListRequestSeen?: () => void;
};

function pending(message: string): "pending" {
    console.warn(`[PENDING] ${message}`);
    return "pending";
}

async function getSnapshotRows(world: BddWorld) {
    if (!world.page) {
        throw new Error("Playwright page was not initialised");
    }

    return world.page.locator(".snapshot-list__item");
}

Given("I am on a content versions page", async function (this: BddWorld) {
    await this.openContentVersionsPage();
});

Given("I have opened a content versions page", async function (this: VersionListWorld) {
    await this.ensureSession();

    if (!this.page || !this.baseUrl) {
        throw new Error("Playwright page was not initialised");
    }

    this.versionListRequestSeen = new Promise<void>((resolve) => {
        this.resolveVersionListRequestSeen = resolve;
    });

    await this.page.route("**/api/1/versionList/**", async (route) => {
        this.resolveVersionListRequestSeen?.();
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await route.continue();
    });
    this.versionListDelayHooked = true;

    await this.page.goto(this.baseUrl, { waitUntil: "domcontentloaded", timeout: 60 * 1000 });
    const composerUrlInput = this.page.getByLabel("Enter a composer url:");
    await expect(composerUrlInput).toBeVisible({ timeout: 10 * 1000 });
    await composerUrlInput.fill("568c4110e4b0c73bdb0e52df");

    const searchButton = this.page.getByRole("button", { name: "Search" });
    await expect(searchButton).toBeEnabled();
    await searchButton.click();
});

Given("the snapshot service returns multiple versions", async function (this: BddWorld) {
    await this.openContentVersionsPage();

    const rows = await getSnapshotRows(this);
    const count = await rows.count();
    if (count < 2) {
        return pending("Current fixture does not expose multiple snapshots to validate list ordering.");
    }
});

Given("the snapshot list has loaded successfully", async function (this: BddWorld) {
    await this.openContentVersionsPage();
});

Given("a snapshot model belongs to a secondary system", async function (this: BddWorld) {
    await this.openContentVersionsPage();

    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const secondaryRows = this.page.locator(".snapshot-list-secondary");
    if ((await secondaryRows.count()) === 0) {
        return pending("Current fixture has no secondary-system snapshots.");
    }
});

Given("a snapshot has no revision id in content change details", async function () {
    return pending("Requires fixture mutation to remove revision id for a snapshot.");
});

Given("the snapshot list is displayed", async function (this: BddWorld) {
    await this.openContentVersionsPage();
});

Given("a snapshot reason is Published or contains launch", async function (this: BddWorld) {
    await this.openContentVersionsPage();

    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const highlightedRows = this.page.locator(".snapshot-list__item.highlight-row-for-launches");
    if ((await highlightedRows.count()) === 0) {
        return pending("Current fixture has no launch-highlighted snapshots.");
    }
});

Given("snapshot settings include legally sensitive and commentable states", async function (this: BddWorld) {
    await this.openContentVersionsPage();

    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const settingsIcons = this.page.locator(
        ".snapshot-list__item__settings__legally-sensitive, .snapshot-list__item__settings__comments--on, .snapshot-list__item__settings__comments--off"
    );

    if ((await settingsIcons.count()) === 0) {
        return pending("Current fixture does not expose legal/comment settings indicators.");
    }
});

Given("a snapshot may be scheduled, embargoed, published, or taken down", async function (this: BddWorld) {
    await this.openContentVersionsPage();

    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const statusCells = this.page.locator(".snapshot-list__item__status--right");
    if ((await statusCells.count()) === 0) {
        return pending("Current fixture has no published-state status labels.");
    }
});

Given("the version list endpoint returns an empty array", async function () {
    return pending("Requires API stubbing/failure injection for empty version list response.");
});

Given("the version list endpoint request fails", async function () {
    return pending("Requires API stubbing/failure injection for failed version list response.");
});

When("snapshot data is loaded", async function (this: BddWorld) {
    const rows = await getSnapshotRows(this);
    await expect(rows.first()).toBeVisible({ timeout: 10 * 1000 });
});

When("the snapshot list request is still in progress", async function (this: BddWorld) {
    const typedWorld = this as VersionListWorld;
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    if (typedWorld.versionListRequestSeen) {
        await typedWorld.versionListRequestSeen;
    }

    await expect(this.page.locator("gu-row.content")).toHaveCount(0);
});

When("the collection is constructed", async function () {
    // Construction occurs as part of page load; assertions are in Then steps.
});

When("the sidebar is first rendered", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    await expect(this.page.locator(".sidebar")).toBeVisible({ timeout: 10 * 1000 });
});

When("the first snapshot is activated", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    await expect(this.page.locator(".snapshot-list__item.item-active").first()).toBeVisible({ timeout: 10 * 1000 });
});

When("500 milliseconds have elapsed", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    await this.page.waitForTimeout(600);
});

When("that model is rendered in the list", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    await expect(this.page.locator(".snapshot-list")).toBeVisible({ timeout: 10 * 1000 });
});

When("the row index is rendered", async function () {
    // Rendering is implicit in the list view.
});

When("each row is rendered", async function (this: BddWorld) {
    const rows = await getSnapshotRows(this);
    await expect(rows.first()).toBeVisible({ timeout: 10 * 1000 });
});

When("that row is rendered", async function () {
    // Rendering is implicit in the list view.
});

When("the row status is displayed", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    await expect(this.page.locator(".snapshot-list__item__status").first()).toBeVisible({ timeout: 10 * 1000 });
});

When("published state is evaluated", async function () {
    // Evaluation is implicit in rendering status labels.
});

When("the snapshot id collection is built", async function () {
    return pending("Collection build failure path requires stubbed API response.");
});

When("collection loading rejects", async function () {
    return pending("Collection rejection path requires stubbed API failure.");
});

Then("I should see a sidebar list of available snapshot versions", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    await expect(this.page.locator(".sidebar .snapshot-list")).toBeVisible({ timeout: 10 * 1000 });
    const rows = await getSnapshotRows(this);
    expect(await rows.count()).toBeGreaterThan(0);
});

Then("loading bars should be visible", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const loadingBars = this.page.locator(".loading-bars");
    await expect(loadingBars).toHaveCount(1, { timeout: 10 * 1000 });
});

Then("the content layout should be hidden until loading completes", async function (this: VersionListWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    await expect(this.page.locator("gu-row.content")).toHaveCount(0);

    if (this.versionListDelayHooked) {
        await this.page.unroute("**/api/1/versionList/**");
        this.versionListDelayHooked = false;
    }

    await expect(this.page.locator("gu-row.content")).toBeVisible({ timeout: 15 * 1000 });
    await expect(this.page.locator(".snapshot-list__item").first()).toBeVisible({ timeout: 15 * 1000 });
});

Then("snapshots should be ordered by created date descending", async function () {
    return pending("Validating precise createdDate ordering needs stable timestamp extraction from UI/API response pairing.");
});

Then("the first model in the list should have active state", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const firstRow = this.page.locator(".snapshot-list__item").first();
    await expect(firstRow).toHaveClass(/item-active/);
});

Then("article title should show the active snapshot headline", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const heading = this.page.locator("h1.article-headline");
    await expect(heading).toBeVisible();
    await expect(heading).not.toHaveText(/^\s*$/);
});

Then("article hash should show the active snapshot content id", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const hash = this.page.locator("h6.article-hash");
    await expect(hash).toContainText("568c4110e4b0c73bdb0e52df");
});

Then("article link should point to the active snapshot composer url", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const link = this.page.locator("h6.article-hash a");
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /\/content\/568c4110e4b0c73bdb0e52df/);
});

Then("the sidebar should transition to active state", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    await expect(this.page.locator(".sidebar")).toHaveClass(/active/);
});

Then("a row should indicate the snapshot came from composer-secondary", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    await expect(this.page.locator(".snapshot-list-secondary").first()).toContainText("composer-secondary");
});

Then("the row should display fallback numbering based on list position", async function () {
    return pending("Requires crafted fixture with missing revision ids to assert fallback numbering deterministically.");
});

Then("it should show relative age text and last modified user", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const firstRow = this.page.locator(".snapshot-list__item").first();
    await expect(firstRow.locator(".snapshot-list__item__content__relative-date")).toContainText("ago");
    await expect(firstRow.locator(".snapshot-list__item__content__reason").first()).toContainText("Last modified by:");
});

Then("launch highlight classes should be applied to row and reason text", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    await expect(this.page.locator(".snapshot-list__item.highlight-row-for-launches").first()).toBeVisible();
    await expect(this.page.locator(".snapshot-list__item__content__reason.highlight-reason-for-launches").first()).toBeVisible();
});

Then("legal sensitivity and comments on or off indicators should reflect those settings", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const indicators = this.page.locator(
        ".snapshot-list__item__settings__legally-sensitive, .snapshot-list__item__settings__comments--on, .snapshot-list__item__settings__comments--off"
    );
    expect(await indicators.count()).toBeGreaterThan(0);
});

Then("the status label should display the matching state text", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const statusCell = this.page.locator(".snapshot-list__item__status--right").first();
    await expect(statusCell).toBeVisible();
    await expect(statusCell).not.toHaveText(/^\s*$/);
});

Then("the request should reject with a no snapshots error", async function () {
    return pending("Requires empty array API fixture to verify no snapshots rejection.");
});

Then("the controller should publish an error event and stop loading", async function () {
    return pending("Requires observable mediator error hook and forced list loading failure.");
});

Then("the list controller should stop loading and publish an error event", async function () {
    return pending("Requires observable mediator error hook and forced list request failure.");
});
