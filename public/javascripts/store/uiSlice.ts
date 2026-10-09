import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Version } from '../models';
import { errorMessage } from './apiError';

type UiState = {
    selection: Record<string, string>;
    showJson: boolean;
    modalOpen: boolean;
    error: string | null;
};

const initialState: UiState = { selection: {}, showJson: false, modalOpen: false, error: null };

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        selectVersion: (state, { payload }: PayloadAction<{ contentId: string; key: string }>) => {
            state.selection[payload.contentId] = payload.key;
            state.showJson = false;
            state.modalOpen = false;
        },
        toggleJson: (state) => { state.showJson = !state.showJson; },
        openModal: (state) => { state.modalOpen = true; },
        closeModal: (state) => { state.modalOpen = false; state.showJson = false; },
        resetView: (state) => { state.modalOpen = false; state.showJson = false; state.error = null; },
        setError: {
            reducer: (state, { payload }: PayloadAction<string>) => { state.error = payload; state.modalOpen = false; state.showJson = false; },
            prepare: (error: unknown) => ({ payload: errorMessage(error) }),
        },
        clearError: (state) => { state.error = null; },
    },
});

export const selectActiveVersion = createSelector([
    (state: { ui: UiState }, contentId: string) => state.ui.selection[contentId],
    (_state: { ui: UiState }, _contentId: string, versions: Version[]) => versions,
], (key, versions) => versions.find((version) => version.key === key) ?? versions[0]);

export const { selectVersion, toggleJson, openModal, closeModal, resetView, setError, clearError } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;