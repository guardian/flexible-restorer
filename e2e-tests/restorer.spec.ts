import { expect, test } from '@playwright/test';
import type { Page, Request } from '@playwright/test';
import type { Destination, SnapshotSummary } from '../public/javascripts/models';

const contentId = 'article-123';
const contentPath = `/content/${contentId}/versions`;
const versions: SnapshotSummary[] = [1, 2, 3].map((revision) => ({
    system: { id: revision === 3 ? 'secondary' : 'primary', composerPrefix: 'https://composer.example', isSecondary: revision === 3 },
    contentId,
    timestamp: `2026-01-0${revision}T12:00:00Z`,
    info: {
        metadata: { reason: revision === 3 ? 'Published' : 'Autosave' },
        summary: {
            preview: { fields: { headline: 'A headline with restored content' }, settings: { legallySensitive: 'true', commentable: 'false' } },
            published: revision === 3,
            contentChangeDetails: { revision, lastModified: { user: { firstName: 'Test', lastName: 'Editor' } } },
        },
    },
}));
const destinations: Destination[] = [
    { systemId: 'secondary', displayName: 'Composer Secondary', composerPrefix: 'https://composer.example', available: true, changeDetails: { revisionId: 4, lastModified: '2026-01-04T12:00:00Z' } },
    { systemId: 'primary', displayName: 'Composer Primary', composerPrefix: 'https://primary.example', available: true },
    { systemId: 'offline', displayName: 'Offline Composer', composerPrefix: 'https://offline.example', available: false },
];

type Options = {
    canRestore?: boolean;
    anyStack?: boolean;
    empty?: boolean;
    listError?: boolean;
    destinationError?: boolean;
    restoreError?: boolean;
    userError?: boolean;
    permissionError?: boolean;
};

const mockApi = async (page: Page, options: Options = {}) => {
    const requests: Request[] = [];
    await page.route('**/guardian-tool-accessed?*', (route) => route.fulfill({ status: 204 }));
    await page.route('https://*.example/content/*', (route) => route.fulfill({ contentType: 'text/html', body: '<h1>Composer destination</h1>' }));
    await page.route('**/api/1/**', async (route) => {
        const request = route.request();
        requests.push(request);
        const path = new URL(request.url()).pathname;
        if (path.endsWith('/user/permissions')) {
            await route.fulfill(options.permissionError ? { status: 403, body: 'Permission service unavailable' } : { json: { restore_content: options.canRestore ?? true, restore_content_to_any_stack: options.anyStack ?? false } });
        } else if (path.endsWith('/user')) {
            await route.fulfill(options.userError ? { status: 403, body: 'Access denied' } : { json: { firstName: 'Test', lastName: 'Editor', email: 'test@example.com' } });
        } else if (path.includes('/versionList/')) {
            await route.fulfill(options.listError ? { status: 500, body: 'Snapshots unavailable' } : { json: options.empty ? [] : versions });
        } else if (path.includes('/version/')) {
            const timestamp = decodeURIComponent(path.split('/').at(-1) ?? '');
            await route.fulfill({ json: { preview: { fields: { headline: `Snapshot ${timestamp}`, standfirst: 'Standfirst', trailText: 'Trail text' }, blocks: [{ elements: [{ fields: { text: `<p>Body for ${timestamp}</p><gu-note class="note">Editorial note</gu-note><script>window.snapshotExecuted = true</script>` } }] }] } } });
        } else if (path.includes('/restore/destinations/')) {
            await route.fulfill(options.destinationError ? { status: 503, body: 'Unavailable' } : { json: destinations });
        } else if (request.method() === 'POST') {
            await route.fulfill(options.restoreError ? { status: 403, body: 'Restore forbidden by the server' } : { status: 200, body: 'Restored' });
        } else {
            await route.fulfill({ status: 404 });
        }
    });
    return requests;
};

const openRestore = async (page: Page) => {
    await page.getByRole('button', { name: 'Restore', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Before you restore' })).toBeVisible();
};

test('searches a Composer URL, selects revisions, toggles JSON and preserves export URLs', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const requests = await mockApi(page);
    await page.goto('/');
    await page.getByLabel('Composer URL or content ID').fill(`https://composer.example/content/${contentId}/?mode=edit`);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page).toHaveURL(contentPath);
    await expect(page.getByTestId('snapshot-html')).toContainText('2026-01-03');
    await expect(page.getByTestId('snapshot-html').locator('gu-note')).toContainText('Editorial note');
    await expect(page.getByRole('button', { name: /^Revision 3,/ })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: /^Revision 1,/ }).click();
    await expect(page.getByTestId('snapshot-html')).toContainText('2026-01-01');
    await page.getByRole('button', { name: 'Show JSON', exact: true }).click();
    await expect(page.getByTestId('snapshot-json')).toContainText('Snapshot 2026-01-01');
    await page.getByRole('button', { name: 'Show TEXT', exact: true }).click();
    await expect(page.getByTestId('snapshot-html')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Export all as Git Repo' })).toHaveAttribute('href', `/export/${contentId}/git`);
    await expect(page.getByRole('link', { name: 'Export all as Zip' })).toHaveAttribute('href', `/export/${contentId}/zip`);
    expect(requests.filter((request) => new URL(request.url()).pathname.endsWith('/user'))).toHaveLength(1);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => 'snapshotExecuted' in window)).toBe(false);
});

test('copies the original snapshot JSON', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await mockApi(page);
    await page.goto(contentPath);
    await page.getByRole('button', { name: 'Copy JSON', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Copied!', exact: true })).toBeVisible();
    expect(JSON.parse(await page.evaluate(() => navigator.clipboard.readText())).preview.fields.headline).toContain('2026-01-03');
});

test('does not display a late response under a newer selection', async ({ page }) => {
    await mockApi(page);
    let release: () => void = () => {};
    const delayed = new Promise<void>((resolve) => { release = resolve; });
    await page.route('**/api/1/version/primary/**', async (route) => {
        await delayed;
        await route.fulfill({ json: { preview: { fields: { headline: 'Delayed snapshot' }, blocks: [{ elements: [{ fields: { text: '<p>Delayed body</p>' } }] }] } } });
    });
    await page.goto(contentPath);
    await expect(page.getByTestId('snapshot-html')).toContainText('2026-01-03');
    const requested = page.waitForRequest('**/api/1/version/primary/**');
    await page.getByRole('button', { name: /^Revision 2,/ }).click();
    await requested;
    await expect(page.getByTestId('snapshot-html')).toHaveCount(0);
    await page.getByRole('button', { name: /^Revision 3,/ }).click();
    await expect(page.getByTestId('snapshot-html')).toContainText('2026-01-03');
    const received = page.waitForResponse('**/api/1/version/primary/**');
    release();
    await received;
    await expect(page.getByTestId('snapshot-html')).toContainText('2026-01-03');
    await expect(page.getByTestId('snapshot-html')).not.toContainText('Delayed body');
});

test('does not dismiss or resubmit a pending restore', async ({ page }) => {
    await mockApi(page);
    let release: () => void = () => {};
    const delayed = new Promise<void>((resolve) => { release = resolve; });
    let posts = 0;
    await page.route('**/api/1/restore/**/to/**', async (route) => {
        posts += 1;
        await delayed;
        await route.fulfill({ body: 'Restored' });
    });
    await page.goto(contentPath);
    await openRestore(page);
    await page.getByText('You are not in content', { exact: true }).click();
    await page.getByText('No one else is in the content', { exact: true }).click();
    await page.getByRole('button', { name: 'Restore Version', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Restoring...' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(posts).toBe(1);
    release();
    await expect(page).toHaveURL(`https://composer.example/content/${contentId}`);
});

test('retains page-path telemetry and reports missing snapshots', async ({ page }) => {
    await mockApi(page);
    await page.route('**/api/1/version/**', (route) => route.fulfill({ status: 404, body: 'Snapshot not found' }));
    const telemetry = page.waitForRequest('**/guardian-tool-accessed?*');
    await page.goto(contentPath);
    expect(new URL((await telemetry).url()).searchParams.get('path')).toBe(contentPath);
    await expect(page.getByRole('alert')).toContainText('Snapshot not found');
    await expect(page.getByRole('button', { name: 'Restore', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Retry snapshot' })).toBeVisible();
});

test('requires confirmations, filters destinations, posts the selected revision and redirects', async ({ page }) => {
    const requests = await mockApi(page);
    await page.goto(contentPath);
    await openRestore(page);
    await expect(page.getByRole('radio')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Restore Version', exact: true })).toBeDisabled();
    await page.getByText('You are not in content', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'Restore Version', exact: true })).toBeDisabled();
    await page.getByText('No one else is in the content', { exact: true }).click();
    await page.getByRole('button', { name: 'Restore Version', exact: true }).click();
    await expect(page).toHaveURL(`https://composer.example/content/${contentId}`);
    const posts = requests.filter((request) => request.method() === 'POST');
    expect(posts).toHaveLength(1);
    expect(new URL(posts[0]!.url()).pathname).toBe(`/api/1/restore/secondary/${contentId}/2026-01-03T12%3A00%3A00Z/to/secondary`);
});

test('permits alternate stacks only with permission and disables unavailable destinations', async ({ page }) => {
    await mockApi(page, { anyStack: true });
    await page.goto(contentPath);
    await openRestore(page);
    await expect(page.getByRole('radio')).toHaveCount(3);
    await expect(page.getByRole('radio', { name: /Offline Composer/ })).toBeDisabled();
    await page.getByText('Composer Primary: content not on this instance', { exact: true }).click();
    await page.getByText('You are not in content', { exact: true }).click();
    await page.getByText('No one else is in the content', { exact: true }).click();
    await page.getByRole('button', { name: 'Restore Version', exact: true }).click();
    await expect(page).toHaveURL(`https://primary.example/content/${contentId}`);
});

test('resets confirmations after Escape and restores focus', async ({ page }) => {
    await mockApi(page);
    await page.goto(contentPath);
    await openRestore(page);
    await page.getByText('You are not in content', { exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Restore', exact: true })).toBeFocused();
    await openRestore(page);
    await expect(page.getByRole('checkbox', { name: 'You are not in content' })).not.toBeChecked();
    await expect(page.getByRole('button', { name: 'Restore Version', exact: true })).toBeDisabled();
});

test('blocks restore by mouse and keyboard without restore permission', async ({ page }) => {
    const requests = await mockApi(page, { canRestore: false });
    await page.goto(contentPath);
    await expect(page.getByTestId('snapshot-html')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Restore', exact: true })).toHaveCount(0);
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(requests.filter((request) => request.method() === 'POST')).toHaveLength(0);
});

test('wraps keyboard selection and blocks it while a dialog is open', async ({ page }) => {
    await mockApi(page);
    await page.goto(contentPath);
    await expect(page.getByTestId('snapshot-html')).toContainText('2026-01-03');
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await page.keyboard.press('ArrowUp');
    await expect(page.getByTestId('snapshot-html')).toContainText('2026-01-01');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByTestId('snapshot-html')).toContainText('2026-01-03');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('snapshot-json')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /^Revision 3,/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('snapshot-html')).toBeVisible();
});

test('shows restore errors, closes the modal, and allows another attempt', async ({ page }) => {
    const requests = await mockApi(page, { restoreError: true });
    await page.goto(contentPath);
    await openRestore(page);
    await page.getByText('You are not in content', { exact: true }).click();
    await page.getByText('No one else is in the content', { exact: true }).click();
    await page.getByRole('button', { name: 'Restore Version', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Restore forbidden by the server');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(contentPath);
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await openRestore(page);
    await expect(page.getByRole('button', { name: 'Restore Version', exact: true })).toBeDisabled();
    expect(requests.filter((request) => request.method() === 'POST')).toHaveLength(1);
});

test('retains the quiet empty destination state after a lookup failure', async ({ page }) => {
    const requests = await mockApi(page, { destinationError: true });
    await page.goto(contentPath);
    await openRestore(page);
    await expect(page.getByText('There are no destinations available.')).toBeVisible();
    await page.getByText('You are not in content', { exact: true }).click();
    await page.getByText('No one else is in the content', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'Restore Version', exact: true })).toBeDisabled();
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(requests.filter((request) => request.method() === 'POST')).toHaveLength(0);
});

test('handles empty lists and backend list errors', async ({ page }) => {
    await mockApi(page, { empty: true });
    await page.goto(contentPath);
    await expect(page.getByText('There are no snapshots available for this piece of content.')).toBeVisible();
    await page.unroute('**/api/1/**');
    await mockApi(page, { listError: true });
    await page.reload();
    await expect(page.getByRole('alert')).toContainText('Snapshots unavailable');
    await expect(page.getByRole('button', { name: 'Retry versions' })).toBeVisible();
});

test('surfaces authentication and permission errors without exposing restore', async ({ page }) => {
    await mockApi(page, { userError: true });
    await page.goto(contentPath);
    await expect(page.getByRole('alert')).toContainText('Access denied');
    await expect(page.getByRole('button', { name: 'Restore', exact: true })).toHaveCount(0);
    await page.unroute('**/api/1/**');
    await mockApi(page, { permissionError: true });
    await page.reload();
    await expect(page.getByRole('alert')).toContainText('Permission service unavailable');
    await expect(page.getByRole('button', { name: 'Restore', exact: true })).toHaveCount(0);
});

test('honours server feature defaults, persists overrides and resets them', async ({ page, context }) => {
    await context.addCookies([{ name: 'restorer-feature-defaults', value: encodeURIComponent('{"compactSnapshotList":true}'), url: 'http://127.0.0.1:5175' }]);
    await mockApi(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Feature flags' }).click();
    await expect(page.getByRole('checkbox', { name: 'Compact snapshot list' })).toBeChecked();
    await page.getByText('Compact snapshot list', { exact: true }).click();
    await page.reload();
    await page.getByRole('button', { name: 'Feature flags' }).click();
    await expect(page.getByRole('checkbox', { name: 'Compact snapshot list' })).not.toBeChecked();
    await page.getByRole('button', { name: 'Use server defaults' }).click();
    await expect(page.getByRole('checkbox', { name: 'Compact snapshot list' })).toBeChecked();
});

test('renders the workspace and modal without horizontal overflow', async ({ page }, testInfo) => {
    await mockApi(page);
    await page.goto(contentPath);
    await expect(page.getByTestId('snapshot-html')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('workspace.png'), fullPage: true });
    await openRestore(page);
    const dialog = await page.getByRole('dialog').boundingBox();
    expect(dialog).not.toBeNull();
    expect(dialog!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    const submit = await page.getByRole('button', { name: 'Restore Version', exact: true }).boundingBox();
    expect(submit!.x + submit!.width).toBeLessThanOrEqual(dialog!.x + dialog!.width);
    await page.screenshot({ path: testInfo.outputPath('restore.png'), fullPage: true });
});