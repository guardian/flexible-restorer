import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

/** Typed `useDispatch` for the app store. */
const useAppDispatch: () => AppDispatch = useDispatch;

/** Typed `useSelector` for the app store. */
const useAppSelector = useSelector.withTypes<RootState>();

const selectActiveIndex = (state: RootState): number =>
	state.viewer.activeIndex;

const selectDisplayState = (state: RootState): RootState['viewer']['displayState'] =>
	state.viewer.displayState;

const selectIsModalOpen = (state: RootState): boolean =>
	state.viewer.displayState === 'modal';

const selectError = (state: RootState): string | null => state.viewer.error;

export {
	useAppDispatch,
	useAppSelector,
	selectActiveIndex,
	selectDisplayState,
	selectIsModalOpen,
	selectError,
};
