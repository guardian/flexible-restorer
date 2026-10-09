import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { restorerApi } from './restorerApi';
import { uiReducer } from './uiSlice';
import { featureFlagsReducer, resetFeatureFlags, setFeatureFlag } from './featureFlags';

export const createAppStore = () => {
    const listeners = createListenerMiddleware();
    const appStore = configureStore({
        reducer: { ui: uiReducer, featureFlags: featureFlagsReducer, [restorerApi.reducerPath]: restorerApi.reducer },
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listeners.middleware).concat(restorerApi.middleware),
    });
    listeners.startListening({
        matcher: isAnyOf(setFeatureFlag, resetFeatureFlags),
        effect: () => {
            const value = encodeURIComponent(JSON.stringify(appStore.getState().featureFlags.overrides));
            document.cookie = `restorer-feature-overrides=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
        },
    });
    return appStore;
};

export const store = createAppStore();
setupListeners(store.dispatch);
export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];