import { configureStore, isPlain } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import moment from 'moment';
import { api } from './api';
import { viewerSlice } from './viewerSlice';

/**
 * The single application store. Because each migrated React component is mounted
 * as a separate `react2angular` root, this module-level singleton is shared by
 * every root (via `withStore`) so they read and write the same state.
 */
const store = configureStore({
	reducer: {
		[api.reducerPath]: api.reducer,
		viewer: viewerSlice.reducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			// The parsed version list cached by `getSnapshotList` holds `moment`
			// values (parsed on ingress); treat them as serialisable.
			serializableCheck: {
				isSerializable: (value: unknown) =>
					moment.isMoment(value) || isPlain(value),
			},
		}).concat(api.middleware),
});

// Enables RTK Query refetchOnFocus/refetchOnReconnect behaviours.
setupListeners(store.dispatch);

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

export { store };
export type { RootState, AppDispatch };
