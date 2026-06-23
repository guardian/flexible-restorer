import { After, IWorldOptions, World, setDefaultTimeout, setWorldConstructor } from "@cucumber/cucumber";
import { chromium, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { createPanDomainCookie } from "../../e2e/panDomainCookie";
import { startLocalStack, stopLocalStack, type LocalStack } from "../../e2e/stackContainers";
import fs from "fs";
import path from "path";

const DEFAULT_CONTENT_ID = "568c4110e4b0c73bdb0e52df";

setDefaultTimeout(180 * 1000);

class BddWorld extends World {
    browser: Browser | undefined;
    context: BrowserContext | undefined;
    page: Page | undefined;
    stack: LocalStack | undefined;
    baseUrl: string | undefined;
    panDomainPrivateKey: string | undefined;
    usingExistingStack: boolean;

    constructor(options: IWorldOptions) {
        super(options);
        this.usingExistingStack = false;
    }

    private resolveExistingStackConfig(projectRoot: string): { baseUrl: string; panDomainPrivateKey: string } | undefined {
        const envBaseUrl = process.env.BDD_BASE_URL;
        const envPanDomainPrivateKey = process.env.BDD_PAN_DOMAIN_PRIVATE_KEY;

        if (envBaseUrl && envPanDomainPrivateKey) {
            return {
                baseUrl: envBaseUrl,
                panDomainPrivateKey: envPanDomainPrivateKey,
            };
        }

        const sessionFile = process.env.BDD_STACK_SESSION_FILE || path.join(projectRoot, ".tmp", "local-stack-session.json");
        if (!fs.existsSync(sessionFile)) {
            return undefined;
        }

        try {
            const rawSession = fs.readFileSync(sessionFile, "utf8");
            const parsed = JSON.parse(rawSession) as {
                baseUrl?: string;
                panDomainPrivateKey?: string;
            };

            if (parsed.baseUrl && parsed.panDomainPrivateKey) {
                return {
                    baseUrl: parsed.baseUrl,
                    panDomainPrivateKey: parsed.panDomainPrivateKey,
                };
            }
        } catch (error) {
            console.warn(`Unable to parse stack session file for BDD reuse: ${sessionFile}`);
            console.warn(error);
        }

        return undefined;
    }

    async ensureSession(): Promise<void> {
        if (this.page && this.baseUrl) {
            return;
        }

        const projectRoot = path.resolve(__dirname, "../../..");
        const existingStackConfig = this.resolveExistingStackConfig(projectRoot);

        if (existingStackConfig) {
            this.usingExistingStack = true;
            this.baseUrl = existingStackConfig.baseUrl;
            this.panDomainPrivateKey = existingStackConfig.panDomainPrivateKey;
        } else {
            this.usingExistingStack = false;
            this.stack = await startLocalStack(projectRoot);
            this.baseUrl = this.stack.baseUrl;
            this.panDomainPrivateKey = this.stack.panDomainPrivateKey;
        }

        this.browser = await chromium.launch({ headless: true });
        const videosDir = process.env.BDD_VIDEOS_DIR || path.join(projectRoot, "tests", "bdd-results", "videos");
        fs.mkdirSync(videosDir, { recursive: true });

        this.context = await this.browser.newContext({
            recordVideo: {
                dir: videosDir,
                size: { width: 1280, height: 720 },
            },
            viewport: { width: 1280, height: 720 },
        });

        if (!this.panDomainPrivateKey || !this.baseUrl) {
            throw new Error("Missing stack baseUrl or pan-domain private key for BDD session");
        }

        const cookieData = createPanDomainCookie(this.panDomainPrivateKey);
        await this.context.addCookies([
            {
                name: "gutoolsAuth-assym",
                value: cookieData,
                url: this.baseUrl,
            },
        ]);

        this.page = await this.context.newPage();
    }

    async openContentVersionsPage(contentId: string = DEFAULT_CONTENT_ID): Promise<void> {
        await this.ensureSession();

        if (!this.page || !this.baseUrl) {
            throw new Error("Playwright page was not initialised");
        }

        await this.page.goto(this.baseUrl, { waitUntil: "domcontentloaded", timeout: 60 * 1000 });

        const composerUrlInput = this.page.getByLabel("Enter a composer url:");
        await expect(composerUrlInput).toBeVisible({ timeout: 10 * 1000 });
        await composerUrlInput.fill(contentId);

        const searchButton = this.page.getByRole("button", { name: "Search" });
        await expect(searchButton).toBeEnabled();
        await searchButton.click();

        await expect(this.page.locator(".snapshot-content").first()).toBeVisible({ timeout: 10 * 1000 });
        await expect(this.page.locator(".snapshot-list__item").first()).toBeVisible({ timeout: 10 * 1000 });
    }

    async ensureJsonVisible(): Promise<void> {
        if (!this.page) {
            throw new Error("Playwright page was not initialised");
        }

        const container = this.page.locator(".snapshot-content__container").first();
        const classes = await container.getAttribute("class");

        if (!classes?.includes("show-json")) {
            await this.clickDisplayToggle();
            await expect(container).toHaveClass(/show-json/);
        }
    }

    async ensureTextVisible(): Promise<void> {
        if (!this.page) {
            throw new Error("Playwright page was not initialised");
        }

        const container = this.page.locator(".snapshot-content__container").first();
        const classes = await container.getAttribute("class");

        if (classes?.includes("show-json")) {
            await this.clickDisplayToggle();
            await expect(container).not.toHaveClass(/show-json/);
        }
    }

    async clickDisplayToggle(): Promise<void> {
        if (!this.page) {
            throw new Error("Playwright page was not initialised");
        }

        const toggleButton = this.page
            .locator("button.snapshot-content__actions--button")
            .filter({ hasText: /Show JSON|Show TEXT/ })
            .first();

        await expect(toggleButton).toBeVisible();
        await toggleButton.click();
    }

    async instrumentClipboardCopy(): Promise<void> {
        if (!this.page) {
            throw new Error("Playwright page was not initialised");
        }

        await this.page.evaluate(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const win = window as any;
            win.__copyCommandInvoked = false;
            const original = document.execCommand.bind(document);

            document.execCommand = ((commandId: string) => {
                if (commandId === "copy") {
                    win.__copyCommandInvoked = true;
                }
                return original(commandId);
            }) as typeof document.execCommand;
        });
    }

    async wasCopyCommandInvoked(): Promise<boolean> {
        if (!this.page) {
            throw new Error("Playwright page was not initialised");
        }

        return this.page.evaluate(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const win = window as any;
            return Boolean(win.__copyCommandInvoked);
        });
    }

    async loadDifferentSnapshot(): Promise<boolean> {
        if (!this.page) {
            throw new Error("Playwright page was not initialised");
        }

        const snapshotRows = this.page.locator(".snapshot-list__item .snapshot-list__item__content");
        const count = await snapshotRows.count();
        if (count < 2) {
            return false;
        }

        await snapshotRows.nth(1).click();
        await expect(this.page.locator(".snapshot-list__item.item-active")).toBeVisible({ timeout: 10 * 1000 });
        return true;
    }

    async closeRestoreModalIfOpen(): Promise<boolean> {
        if (!this.page) {
            throw new Error("Playwright page was not initialised");
        }

        const restoreButton = this.page
            .locator("button.snapshot-content__actions--button")
            .filter({ hasText: "Restore" })
            .first();

        if (await restoreButton.isVisible()) {
            await restoreButton.click();
        } else {
            const firstSnapshotRow = this.page.locator(".snapshot-list__item .snapshot-list__item__content").first();
            await expect(firstSnapshotRow).toBeVisible();
            await firstSnapshotRow.click();
            await this.page.keyboard.press("Enter");
        }

        const modal = this.page.locator(".modal:not(.visually-hidden)").first();
        await expect(modal).toBeVisible({ timeout: 10 * 1000 });
        await this.page.keyboard.press("Escape");
        await expect(modal).toBeHidden({ timeout: 10 * 1000 });
        return true;
    }
}

setWorldConstructor(BddWorld);

After(async function (this: BddWorld) {
    if (this.context) {
        await this.context.close();
        this.context = undefined;
        this.page = undefined;
    }

    if (this.browser) {
        await this.browser.close();
        this.browser = undefined;
    }

    if (this.stack) {
        await stopLocalStack(this.stack);
        this.stack = undefined;
        this.baseUrl = undefined;
        this.panDomainPrivateKey = undefined;
        this.usingExistingStack = false;
    } else {
        this.baseUrl = undefined;
        this.panDomainPrivateKey = undefined;
        this.usingExistingStack = false;
    }
});

export { BddWorld, DEFAULT_CONTENT_ID };
