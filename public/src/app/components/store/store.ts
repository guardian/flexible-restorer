import { configureStore, isPlain } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { flexibleApi } from './flexibleApi';
import { restorerApi } from './restorerApi';
import { viewerSlice } from './viewerSlice';

/**
 * The single application store shared by the top-level React Provider.
 */
const store = configureStore({
	reducer: {
		[restorerApi.reducerPath]: restorerApi.reducer,
		[flexibleApi.reducerPath]: flexibleApi.reducer,
		viewer: viewerSlice.reducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			// The parsed snapshot/destination view models cached by the service APIs
			// hold `Date` values (parsed on ingress); treat them as serialisable.
			serializableCheck: {
				isSerializable: (value: unknown) =>
					value instanceof Date || isPlain(value),
			},
		}).concat(restorerApi.middleware, flexibleApi.middleware),
});

// Enables RTK Query refetchOnFocus/refetchOnReconnect behaviours.
setupListeners(store.dispatch);

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

export { store };
export type { RootState, AppDispatch };
