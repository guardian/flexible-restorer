import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from './store';
import { restorerApi } from './restorerApi';
import { errorMessage } from './apiError';
import { readFlags, resetFeatureFlags, setFeatureFlag } from './featureFlags';

const NativeRequest = globalThis.Request;
let store = createAppStore();
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
    store = createAppStore();
    vi.stubGlobal('Request', class extends NativeRequest {
        constructor(input: RequestInfo | URL, init?: RequestInit) {
            super(typeof input === 'string' ? new URL(input, 'http://localhost') : input, init);
        }
    });
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
});

afterEach(() => {
    store.dispatch(restorerApi.util.resetApiState());
    vi.unstubAllGlobals();
    document.cookie = 'restorer-feature-overrides=; Max-Age=0; Path=/';
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; Path=/';
});

describe('RTK Query requests', () => {
    it('deduplicates subscriptions for the same content and parses on ingress', async () => {
        fetchMock.mockResolvedValue(new Response(JSON.stringify([{ system: { id: 'source', composerPrefix: 'https://composer.example' }, contentId: 'article', timestamp: '2026-01-01', info: {} }])));
        const first = store.dispatch(restorerApi.endpoints.getVersions.initiate('article'));
        const second = store.dispatch(restorerApi.endpoints.getVersions.initiate('article'));
        const [firstResult, secondResult] = await Promise.all([first.unwrap(), second.unwrap()]);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(firstResult).toBe(secondResult);
        expect(firstResult[0]).toMatchObject({ contentId: 'article', headline: '', legallySensitive: false });
        first.unsubscribe();
        second.unsubscribe();
    });

    it('encodes each snapshot path segment and preserves original JSON', async () => {
        const data = { preview: { fields: { headline: 'Snapshot' }, blocks: [] }, extra: 'retained' };
        fetchMock.mockResolvedValue(new Response(JSON.stringify(data)));
        const result = await store.dispatch(restorerApi.endpoints.getSnapshot.initiate({ systemId: 'a/b', contentId: 'a?b', timestamp: '2026-01-01T12:00:00+01:00' })).unwrap();
        const request = fetchMock.mock.calls[0]?.[0] as Request;
        expect(request.url).toContain('/version/a%2Fb/a%3Fb/2026-01-01T12%3A00%3A00%2B01%3A00');
        expect(result.headline).toBe('Snapshot');
        expect(JSON.parse(result.json)).toEqual(data);
    });

    it('sends a non-cached POST with same-origin credentials and the existing XSRF header', async () => {
        document.cookie = 'XSRF-TOKEN=token%20value; Path=/';
        fetchMock.mockImplementation(async () => new Response('Restored'));
        const args = { systemId: 'source', contentId: 'article', timestamp: 'date', destinationId: 'destination' };
        await store.dispatch(restorerApi.endpoints.restore.initiate(args)).unwrap();
        await store.dispatch(restorerApi.endpoints.restore.initiate(args)).unwrap();
        expect(fetchMock).toHaveBeenCalledTimes(2);
        const request = fetchMock.mock.calls[0]?.[0] as Request;
        expect(request.method).toBe('POST');
        expect(request.url).toBe('http://localhost/api/1/restore/source/article/date/to/destination');
        expect(request.credentials).toBe('same-origin');
        expect(request.headers.get('X-XSRF-TOKEN')).toBe('token value');
    });

    it('preserves backend error messages and permits retrying a failed mutation', async () => {
        fetchMock.mockResolvedValueOnce(new Response('You do not have restore_content permission', { status: 403 }));
        fetchMock.mockResolvedValueOnce(new Response('Restored'));
        const args = { systemId: 'source', contentId: 'article', timestamp: 'date', destinationId: 'source' };
        const result = await store.dispatch(restorerApi.endpoints.restore.initiate(args));
        expect(errorMessage(result.error)).toBe('You do not have restore_content permission');
        await expect(store.dispatch(restorerApi.endpoints.restore.initiate(args)).unwrap()).resolves.toBe('Restored');
    });
});

describe('feature flags', () => {
    it('ignores malformed cookies and unknown or non-boolean flag values', () => {
        expect(readFlags('flags', 'flags=%bad')).toEqual({});
        expect(readFlags('flags', `flags=${encodeURIComponent('{"compactSnapshotList":"true","other":true}')}`)).toEqual({});
        expect(readFlags('flags', `flags=${encodeURIComponent('{"compactSnapshotList":true}')}`)).toEqual({ compactSnapshotList: true });
    });
    it('persists overrides and resets to server defaults', () => {
        store.dispatch(setFeatureFlag({ name: 'compactSnapshotList', enabled: true }));
        expect(readFlags('restorer-feature-overrides')).toEqual({ compactSnapshotList: true });
        store.dispatch(resetFeatureFlags());
        expect(readFlags('restorer-feature-overrides')).toEqual({});
        expect(store.getState().featureFlags.defaults.compactSnapshotList).toBe(false);
    });
});