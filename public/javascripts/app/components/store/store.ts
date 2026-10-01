import { configureStore, isPlain } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import moment from 'moment';
import { restorerApi } from './restorerApi';
import { flexibleApi } from './flexibleApi';
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
			// hold `moment` values (parsed on ingress); treat them as serialisable.
			serializableCheck: {
				isSerializable: (value: unknown) =>
					moment.isMoment(value) || isPlain(value),
			},
		}).concat(restorerApi.middleware, flexibleApi.middleware),
});

// Enables RTK Query refetchOnFocus/refetchOnReconnect behaviours.
setupListeners(store.dispatch);

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

export { store };
export type { RootState, AppDispatch };
