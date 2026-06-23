import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { BddWorld } from "../support/world";

function pending(message: string): "pending" {
    console.warn(`[PENDING] ${message}`);
    return "pending";
}

Given("I open a content versions page with at least one snapshot", async function (this: BddWorld) {
    await this.openContentVersionsPage();
});

Given("snapshot content has been loaded", async function (this: BddWorld) {
    await this.openContentVersionsPage();
});

Given("I am viewing text content in the content pane", async function (this: BddWorld) {
    await this.openContentVersionsPage();
    await this.ensureTextVisible();
});

Given("I am viewing JSON in the content pane", async function (this: BddWorld) {
    await this.openContentVersionsPage();
    await this.ensureJsonVisible();
});

Given("I am viewing snapshot JSON", async function (this: BddWorld) {
    await this.openContentVersionsPage();
    await this.ensureJsonVisible();
    await this.instrumentClipboardCopy();
});

Given('I have copied JSON and the button reads "Copied!"', async function (this: BddWorld) {
    await this.openContentVersionsPage();
    await this.ensureJsonVisible();
    await this.instrumentClipboardCopy();

    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const copyButton = this.page
        .locator("button.snapshot-content__actions--button")
        .filter({ hasText: /Copy JSON|Copied!/ })
        .first();

    await copyButton.click();
    await expect(copyButton).toContainText("Copied!");
});

Given("I switched the content pane to JSON mode", async function (this: BddWorld) {
    await this.openContentVersionsPage();
    await this.ensureJsonVisible();
});

Given("I open a content versions page", async function (this: BddWorld) {
    await this.openContentVersionsPage();
});

When("the initial snapshot content is loaded", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    await expect(this.page.locator(".snapshot-content.active").first()).toBeVisible({ timeout: 10 * 1000 });
});

When("the content view is rendered", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    await expect(this.page.locator(".snapshot-content__furniture")).toBeVisible({ timeout: 10 * 1000 });
});

When("I click the display toggle button", async function (this: BddWorld) {
    await this.clickDisplayToggle();
});

When("I click the copy JSON action", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const copyButton = this.page
        .locator("button.snapshot-content__actions--button")
        .filter({ hasText: /Copy JSON|Copied!/ })
        .first();

    await expect(copyButton).toBeVisible();
    await copyButton.click();
});

When("I load a different snapshot version", async function (this: BddWorld) {
    const changed = await this.loadDifferentSnapshot();
    if (!changed) {
        return pending("Content fixture does not contain at least two snapshot rows.");
    }
});

When("the restore modal is closed", async function (this: BddWorld) {
    const closed = await this.closeRestoreModalIfOpen();
    if (!closed) {
        return pending("Restore button is not visible for current auth/permissions fixture.");
    }
});

When("loading the snapshot id collection fails", async function () {
    return pending("Failure injection is required to force getCollection rejection against the local stack.");
});

When("fetching that snapshot fails", async function () {
    return pending("Failure injection is required to force getSnapshot rejection against the local stack.");
});

Then("the content pane should default to text mode", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    await expect(this.page.locator(".snapshot-content__container").first()).not.toHaveClass(/show-json/);
});

Then('the display toggle should read "Show JSON"', async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const toggleButton = this.page
        .locator("button.snapshot-content__actions--button")
        .filter({ hasText: /Show JSON|Show TEXT/ })
        .first();
    await expect(toggleButton).toContainText("Show JSON");
});

Then('the copy button should read "Copy JSON"', async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const copyButton = this.page
        .locator("button.snapshot-content__actions--button")
        .filter({ hasText: /Copy JSON|Copied!/ })
        .first();
    await expect(copyButton).toContainText("Copy JSON");
});

Then("the headline, standfirst, and trail text fields should be shown from the snapshot model", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    await expect(this.page.getByRole("heading", { name: "Headline" })).toBeVisible();
    await expect(this.page.getByRole("heading", { name: "Standfirst" })).toBeVisible();
    await expect(this.page.getByRole("heading", { name: "TrailText" })).toBeVisible();

    const furnitureValues = this.page.locator(".snapshot-content__furniture__item--content");
    await expect(furnitureValues.first()).toBeVisible();
});

Then("the JSON pane should be shown", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    await expect(this.page.locator(".snapshot-content__container").first()).toHaveClass(/show-json/);
});

Then('the display toggle should read "Show TEXT"', async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const toggleButton = this.page
        .locator("button.snapshot-content__actions--button")
        .filter({ hasText: /Show JSON|Show TEXT/ })
        .first();
    await expect(toggleButton).toContainText("Show TEXT");
});

Then("the text pane should be shown", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    await expect(this.page.locator(".snapshot-content__container").first()).not.toHaveClass(/show-json/);
});

Then("the snapshot JSON should be copied to the clipboard", async function (this: BddWorld) {
    const wasCopied = await this.wasCopyCommandInvoked();
    expect(wasCopied).toBeTruthy();
});

Then('the copy button should change to "Copied!"', async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const copyButton = this.page
        .locator("button.snapshot-content__actions--button")
        .filter({ hasText: /Copy JSON|Copied!/ })
        .first();
    await expect(copyButton).toContainText("Copied!");
});

Then('the copy button should reset to "Copy JSON"', async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    const copyButton = this.page
        .locator("button.snapshot-content__actions--button")
        .filter({ hasText: /Copy JSON|Copied!/ })
        .first();
    await expect(copyButton).toContainText("Copy JSON");
});

Then("the content pane should return to text mode", async function (this: BddWorld) {
    if (!this.page) {
        throw new Error("Playwright page was not initialised");
    }

    await expect(this.page.locator(".snapshot-content__container").first()).not.toHaveClass(/show-json/);
});

Then("an error event should be published for global error handling", async function () {
    return pending("Event bus inspection is not currently exposed; verify via injected mediator hooks if needed.");
});
