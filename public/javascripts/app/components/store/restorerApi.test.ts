import { configureStore } from '@reduxjs/toolkit';
import { restorerApi } from './restorerApi';

const makeStore = () =>
	configureStore({
		reducer: { [restorerApi.reducerPath]: restorerApi.reducer },
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware().concat(restorerApi.middleware),
	});

const rawSnapshot = (timestamp: string, systemId: string) => ({
	contentId: 'abc',
	timestamp,
	system: { id: systemId, isSecondary: false, composerPrefix: 'https://composer' },
	info: { summary: { contentChangeDetails: { revision: 7 } } },
});

describe('restorerApi getSnapshotList endpoint', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('fetches and parses the version list on ingress (newest first)', async () => {
		const payload = [
			rawSnapshot('2024-01-01T10:00:00', 'live'),
			rawSnapshot('2024-01-02T10:00:00', 'draft'),
		];
		const fetchMock = jest.fn().mockResolvedValue({
			ok: true,
			json: async () => payload,
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const store = makeStore();
		const result = await store.dispatch(
			restorerApi.endpoints.getSnapshotList.initiate('abc'),
		);

		expect(fetchMock).toHaveBeenCalledWith(
			'/api/1/versionList/abc',
			expect.objectContaining({ credentials: 'same-origin' }),
		);
		expect(result.data).toHaveLength(2);
		// Parsed on ingress: the view model is sorted newest-first.
		expect(result.data?.[0]?.timestamp).toBe('2024-01-02T10:00:00');
		expect(result.data?.[0]?.systemId).toBe('draft');
	});

	it('surfaces a serialisable error on a failed request', async () => {
		globalThis.fetch = jest.fn().mockResolvedValue({
			ok: false,
			status: 500,
			json: async () => ({}),
		}) as unknown as typeof fetch;

		const store = makeStore();
		const result = await store.dispatch(
			restorerApi.endpoints.getSnapshotList.initiate('abc'),
		);

		expect(result.data).toBeUndefined();
		expect(result.error).toEqual({ message: 'Failed to load snapshots (500)' });
	});
});
