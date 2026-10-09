import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { Version } from '../models';
import type { AppDispatch, RootState } from './store';
import { selectActiveVersion, setError } from './uiSlice';
import type { FeatureFlags } from './featureFlags';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
const useAppSelector = useSelector.withTypes<RootState>();
export const useIsJsonVisible = () => useAppSelector((state) => state.ui.showJson);
export const useIsModalOpen = () => useAppSelector((state) => state.ui.modalOpen);
export const useError = () => useAppSelector((state) => state.ui.error);
export const useFeatureFlag = (name: keyof FeatureFlags) => useAppSelector((state) => state.featureFlags.overrides[name] ?? state.featureFlags.defaults[name]);
export const useActiveVersion = (contentId: string, versions: Version[]) => useAppSelector((state) => selectActiveVersion(state, contentId, versions));
export const useReportError = (error: unknown): void => {
    const dispatch = useAppDispatch();
    useEffect(() => { if (error) dispatch(setError(error)); }, [dispatch, error]);
};