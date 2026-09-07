import moment from 'moment';

// The module registers itself against AngularJS via `angular.module(...).factory(...)`.
// We stub `angular` so that requiring the module simply records the factory
// definition array, letting us pull out the factory function and invoke it
// directly with hand-rolled dependencies. Both this collection module and its
// BaseCollection dependency import `angular`, so the single mock covers both.
jest.mock('angular', () => {
    const api = { __registrations: {} };
    const moduleApi = {
        factory: (name, def) => {
            api.__registrations[name] = def;
            return moduleApi;
        },
    };
    api.module = () => moduleApi;
    return { __esModule: true, default: api };
});

// A tiny $q shim backed by native promises — enough for the caching logic,
// which only uses `$q.resolve` / `$q.reject` / `$q.when`.
const $q = {
    resolve: (value) => Promise.resolve(value),
    reject: (err) => Promise.reject(err),
    when: (value) => Promise.resolve(value),
};

// Stand-in for SnapshotIdModel.getModel. The collection comparator only reads
// the `createdDate` moment, so that is all we need to model faithfully.
const SnapshotIdModel = {
    getModel: (snapshot) => ({
        _raw: snapshot,
        get: (key) => (key === 'createdDate' ? moment(snapshot.timestamp) : snapshot[key]),
    }),
};

function makeSnapshot(contentId, timestamp) {
    return {
        system: { id: 'flexible' },
        contentId,
        timestamp,
        info: { metadata: {}, summary: {} },
    };
}

// Build a fake `fetch` Response resolving to the given JSON body. `fetchSnapshotList`
// only reads `response.ok`, `response.status` and `response.json()`.
function jsonResponse(data, { ok = true, status = 200 } = {}) {
    return { ok, status, json: () => Promise.resolve(data) };
}

// Creates a promise whose `resolve`/`reject` are exposed so the test can settle
// it on demand. This lets us hold a request "in flight" while asserting on the
// de-duplication behaviour before letting it complete.
function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

// Load a *fresh* copy of the module (so the module-level `listCache` and
// `inFlight` state is reset between tests) and return its wired-up service
// alongside the `fetch` mock it uses under the hood.
//
// `fetchImpl` is the implementation backing the mocked global `fetch` that the
// shared `fetchSnapshotList` calls. It receives the request URL and must return
// a promise resolving to a `fetch` Response (see `jsonResponse`) to drive the
// success paths, or reject to drive the transport error paths. Because it is a
// function (rather than a fixed value) each test can vary the response per
// call, e.g. fail on the first attempt and succeed on a retry.
function loadService(fetchImpl) {
    let service;
    let fetchMock;
    jest.isolateModules(() => {
        const angular = require('angular').default;
        require('./SnapshotIdModels');
        const definition = angular.__registrations.SnapshotIdModels;
        const factoryFn = definition[definition.length - 1];
        fetchMock = jest.fn(fetchImpl);
        global.fetch = fetchMock;
        service = factoryFn($q, SnapshotIdModel);
    });
    return { service, fetch: fetchMock };
}

describe('SnapshotIdModels.getCollection caching', () => {
    describe('success paths', () => {
        it('fetches the version list and resolves a populated collection', async () => {
            const data = [makeSnapshot('abc', '2024-01-01T00:00:00')];
            const { service, fetch } = loadService(() => Promise.resolve(jsonResponse(data)));

            const collection = await service.getCollection('abc');

            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith('/api/1/versionList/abc', expect.anything());
            expect(collection.length()).toBe(1);
        });

        it('returns the cached instance on subsequent calls without re-fetching', async () => {
            const data = [makeSnapshot('abc', '2024-01-01T00:00:00')];
            const { service, fetch } = loadService(() => Promise.resolve(jsonResponse(data)));

            const first = await service.getCollection('abc');
            const second = await service.getCollection('abc');

            expect(second).toBe(first);
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        it('shares a single in-flight request between concurrent callers', async () => {
            const pending = deferred();
            const { service, fetch } = loadService(() => pending.promise);

            const callA = service.getCollection('abc');
            const callB = service.getCollection('abc');

            // Both callers arrive before the request resolves, so only one
            // network request should have been issued.
            expect(fetch).toHaveBeenCalledTimes(1);

            pending.resolve(jsonResponse([makeSnapshot('abc', '2024-01-01T00:00:00')]));
            const [resultA, resultB] = await Promise.all([callA, callB]);

            expect(resultA).toBe(resultB);
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        it('caches different content ids independently', async () => {
            const { service, fetch } = loadService((url) =>
                Promise.resolve(jsonResponse([makeSnapshot(url, '2024-01-01T00:00:00')]))
            );

            const collectionA = await service.getCollection('abc');
            const collectionB = await service.getCollection('xyz');

            expect(collectionA).not.toBe(collectionB);
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(await service.getCollection('abc')).toBe(collectionA);
            expect(fetch).toHaveBeenCalledTimes(2);
        });

        it('sorts models newest-first via the comparator', async () => {
            const data = [
                makeSnapshot('abc', '2024-01-01T00:00:00'),
                makeSnapshot('abc', '2024-03-01T00:00:00'),
                makeSnapshot('abc', '2024-02-01T00:00:00'),
            ];
            const { service } = loadService(() => Promise.resolve(jsonResponse(data)));

            const collection = await service.getCollection('abc');
            const timestamps = collection
                .getModels()
                .map((model) => model.get('createdDate').format('YYYY-MM-DD'));

            expect(timestamps).toEqual(['2024-03-01', '2024-02-01', '2024-01-01']);
        });
    });

    describe('error paths', () => {
        it('rejects with a helpful message when the data array is empty', async () => {
            const { service } = loadService(() => Promise.resolve(jsonResponse([])));

            await expect(service.getCollection('abc')).rejects.toThrow(
                'There are no snapshots available for this piece of content'
            );
        });

        it('does not cache an empty result, so a later successful call still fetches', async () => {
            let attempt = 0;
            const { service, fetch } = loadService(() => {
                attempt += 1;
                return attempt === 1
                    ? Promise.resolve(jsonResponse([]))
                    : Promise.resolve(jsonResponse([makeSnapshot('abc', '2024-01-01T00:00:00')]));
            });

            await expect(service.getCollection('abc')).rejects.toThrow();
            const collection = await service.getCollection('abc');

            expect(collection.length()).toBe(1);
            expect(fetch).toHaveBeenCalledTimes(2);
        });

        it('rejects when the response payload is not an array', async () => {
            const { service } = loadService(() => Promise.resolve(jsonResponse(null)));

            await expect(service.getCollection('abc')).rejects.toThrow(
                'There are no snapshots available for this piece of content'
            );
        });

        it('propagates transport errors and does not cache them', async () => {
            const failure = new Error('network boom');
            const { service } = loadService(() => Promise.reject(failure));

            await expect(service.getCollection('abc')).rejects.toBe(failure);
        });

        it('clears the in-flight entry after failure so a retry issues a fresh request', async () => {
            let attempt = 0;
            const { service, fetch } = loadService(() => {
                attempt += 1;
                return attempt === 1
                    ? Promise.reject(new Error('network boom'))
                    : Promise.resolve(jsonResponse([makeSnapshot('abc', '2024-01-01T00:00:00')]));
            });

            await expect(service.getCollection('abc')).rejects.toThrow('network boom');
            const collection = await service.getCollection('abc');

            expect(collection.length()).toBe(1);
            expect(fetch).toHaveBeenCalledTimes(2);
        });
    });
});
