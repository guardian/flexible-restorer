import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

/** Which view the content panel is showing; 'modal' means the restore modal is open. */
//TODO: separate the modal state from the display state?
type DisplayState = 'html' | 'json' | 'modal';

type ViewerState = {
	/** Index of the active snapshot within the (newest-first) version list. */
	activeIndex: number;
	displayState: DisplayState;
	/** Message of the most recent application error, or null when none. */
	error: string | null;
};

const initialState: ViewerState = {
	activeIndex: 0,
	displayState: 'html',
	error: null,
};

/** Normalise any thrown/RTK Query error into a displayable message. */
const getErrorMessage = (error: unknown): string => {
	if (
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof (error as { message: unknown }).message === 'string'
	) {
		return (error as { message: string }).message;
	}
	return String(error);
};

const viewerSlice = createSlice({
	name: 'viewer',
	initialState,
	reducers: {
		setActiveIndex: (state, action: PayloadAction<number>) => {
			state.activeIndex = action.payload;
		},
		showHtml: (state) => {
			state.displayState = 'html';
		},
		showJson: (state) => {
			state.displayState = 'json';
		},
		openModal: (state) => {
			state.displayState = 'modal';
		},
		// Closing the modal returns the panel to the HTML view, mirroring the
		// legacy `hiddenModal` event.
		closeModal: (state) => {
			state.displayState = 'html';
		},
		setError: {
			reducer: (state, action: PayloadAction<string>) => {
				state.error = action.payload;
			},
			prepare: (error: unknown) => ({ payload: getErrorMessage(error) }),
		},
		clearError: (state) => {
			state.error = null;
		},
	},
});

const {
	setActiveIndex,
	showHtml,
	showJson,
	openModal,
	closeModal,
	setError,
	clearError,
} = viewerSlice.actions;

export {
	viewerSlice,
	setActiveIndex,
	showHtml,
	showJson,
	openModal,
	closeModal,
	setError,
	clearError,
	getErrorMessage,
};
export type { DisplayState, ViewerState };
