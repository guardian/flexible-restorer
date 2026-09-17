import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { restorerApi } from '../store/restorerApi';
import { viewerSlice } from '../store/viewerSlice';
import { SnapshotSidebar } from './SnapshotSidebar';

const makeStore = () =>
	configureStore({
		reducer: {
			[restorerApi.reducerPath]: restorerApi.reducer,
			viewer: viewerSlice.reducer,
		},
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware().concat(restorerApi.middleware),
	});

const rawSnapshot = (timestamp: string, systemId: string) => ({
	contentId: 'abc',
	timestamp,
	system: { id: systemId, isSecondary: false, composerPrefix: 'https://composer' },
	info: {
		summary: {
			preview: { fields: { headline: `Headline ${systemId}` } },
			contentChangeDetails: { revision: 1 },
		},
	},
});

describe('SnapshotSidebar', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('dispatches the active index and html view on selection', async () => {
		globalThis.fetch = jest.fn().mockResolvedValue({
			ok: true,
			json: async () => [
				rawSnapshot('2024-01-02T10:00:00', 'draft'),
				rawSnapshot('2024-01-01T10:00:00', 'live'),
			],
		}) as unknown as typeof fetch;

		const store = makeStore();
		store.dispatch(viewerSlice.actions.showJson());

		render(
			<Provider store={store}>
				<SnapshotSidebar contentId="abc" />
			</Provider>,
		);

		const items = await screen.findAllByTestId('snapshot-list-item');
		expect(items).toHaveLength(2);
		expect(store.getState().viewer.activeIndex).toBe(0);

		// Click within the second (older) row; the list is sorted newest-first.
		fireEvent.click(within(items[1]!).getByText(/ago/));

		expect(store.getState().viewer.activeIndex).toBe(1);
		expect(store.getState().viewer.contentView).toBe('html');
	});
});
