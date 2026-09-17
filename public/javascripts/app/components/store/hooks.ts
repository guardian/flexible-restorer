import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

/** Typed `useDispatch` for the app store. */
const useAppDispatch: () => AppDispatch = useDispatch;

/** Typed `useSelector` for the app store. */
const useAppSelector = useSelector.withTypes<RootState>();

/** Index of the active snapshot in the version list. */
const useActiveIndex = (): number =>
	useAppSelector((state) => state.viewer.activeIndex);

/** Current content view ('html' | 'json'). */
const useContentView = (): RootState['viewer']['contentView'] =>
	useAppSelector((state) => state.viewer.contentView);

/** Whether the restore modal is open. */
const useIsModalOpen = (): boolean =>
	useAppSelector((state) => state.viewer.isModalOpen);

/** The current application error message, or null when none. */
const useError = (): string | null =>
	useAppSelector((state) => state.viewer.error);

export {
	useAppDispatch,
	useAppSelector,
	useActiveIndex,
	useContentView,
	useIsModalOpen,
	useError,
};
