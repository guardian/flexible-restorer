import { combineReducers, configureStore, isPlain } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { flexibleApi } from './flexibleApi';
import { restorerApi } from './restorerApi';
import { viewerSlice } from './viewerSlice';

const reducer = combineReducers({
	[restorerApi.reducerPath]: restorerApi.reducer,
	[flexibleApi.reducerPath]: flexibleApi.reducer,
	viewer: viewerSlice.reducer,
});

type RootState = ReturnType<typeof reducer>;

/** Build a store instance; used directly by isolated contexts such as Storybook. */
const makeStore = (preloadedState?: Partial<RootState>) =>
	configureStore({
		reducer,
		...(preloadedState ? { preloadedState } : {}),
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware({
				// Snapshot-list view models contain `createdDate` values. Allow these
				// Date instances through the serializability check.
				serializableCheck: {
					isSerializable: (value: unknown) =>
						value instanceof Date || isPlain(value),
				},
			}).concat(restorerApi.middleware, flexibleApi.middleware),
	});

/**
 * The single application store shared by the top-level React Provider.
 */
const store = makeStore();

// Enables RTK Query refetchOnFocus/refetchOnReconnect behaviours.
setupListeners(store.dispatch);

type AppStore = ReturnType<typeof makeStore>;
type AppDispatch = AppStore['dispatch'];

export { store, makeStore };
export type { RootState, AppDispatch, AppStore };
