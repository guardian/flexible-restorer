import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type FeatureFlags = { compactSnapshotList: boolean };
export const fallbackFlags: FeatureFlags = { compactSnapshotList: false };

export const readFlags = (name: string, cookies = document.cookie): Partial<FeatureFlags> => {
    try {
        const value = cookies.split('; ').find((cookie) => cookie.startsWith(`${name}=`))?.slice(name.length + 1);
        const parsed: unknown = value ? JSON.parse(decodeURIComponent(value)) : null;
        if (parsed && typeof parsed === 'object' && 'compactSnapshotList' in parsed && typeof parsed.compactSnapshotList === 'boolean') {
            return { compactSnapshotList: parsed.compactSnapshotList };
        }
    } catch {
        return {};
    }
    return {};
};

const featureFlagsSlice = createSlice({
    name: 'featureFlags',
    initialState: () => ({
        defaults: { ...fallbackFlags, ...readFlags('restorer-feature-defaults') },
        overrides: readFlags('restorer-feature-overrides'),
    }),
    reducers: {
        setFeatureFlag: (state, { payload }: PayloadAction<{ name: keyof FeatureFlags; enabled: boolean }>) => { state.overrides[payload.name] = payload.enabled; },
        resetFeatureFlags: (state) => { state.overrides = {}; },
    },
});

export const { setFeatureFlag, resetFeatureFlags } = featureFlagsSlice.actions;
export const featureFlagsReducer = featureFlagsSlice.reducer;