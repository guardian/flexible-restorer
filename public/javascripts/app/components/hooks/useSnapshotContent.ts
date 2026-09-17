import { useEffect, useLayoutEffect, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import type { SnapshotContent } from '../models/snapshotContent';
import {
	useGetSnapshotListQuery,
	useGetSnapshotQuery,
	useGetUserQuery,
} from '../store/restorerApi';
import {
	useActiveIndex,
	useAppDispatch,
	useContentView,
} from '../store/hooks';
import { openModal, setError, showHtml, showJson } from '../store/viewerSlice';

const COPY_LABEL = 'Copy JSON';
const COPIED_LABEL = 'Copied!';

// Matches the legacy `$timeout(() => isSettingContent = false, 200)` fade.
const FADE_MS = 200;

type UseSnapshotContent = {
	content: SnapshotContent | undefined;
	isShowingJSON: boolean;
	/** True briefly while new content settles, driving the fade-in (`.active`). */
	isSettingContent: boolean;
	copyLabel: string;
	canRestore: boolean;
	toggleJson: () => void;
	restore: () => void;
	copyJson: () => void;
};

// Prefer the async Clipboard API (the modern, standard approach), we have no fallback for non-secure contexts.
const copyToClipboard = async (text: string): Promise<void> => {
	if (window.isSecureContext && navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text);
		return;
	}
};

/**
 * Drives the React snapshot content viewer, porting `SnapshotContentCtrl`.
 *
 * The active selection now lives in the Redux viewer slice (owned by the
 * sidebar): this hook reads `activeIndex`, resolves the matching snapshot from
 * the shared version list and loads its content via RTK Query. The HTML/JSON
 * toggle dispatches to the same slice so the sidebar's keyboard navigation stays
 * in sync.
 */
const useSnapshotContent = (contentId: string): UseSnapshotContent => {
	const { data: snapshots } = useGetSnapshotListQuery(contentId);
	const dispatch = useAppDispatch();
	const activeIndex = useActiveIndex();
	const contentView = useContentView();
	const isShowingJSON = contentView === 'json';
	const [isSettingContent, setIsSettingContent] = useState(false);
	const [copyLabel, setCopyLabel] = useState(COPY_LABEL);

	const activeSnapshot = snapshots?.[activeIndex] ?? snapshots?.[0];

	const { data: user, error: userError } = useGetUserQuery();
	const canRestore = user?.permissions?.restore_content === true;
	useEffect(() => {
		if (userError) {
			dispatch(setError(userError));
		}
	}, [userError, dispatch]);

	const { data: content, error } = useGetSnapshotQuery(activeSnapshot ?? skipToken);

	useEffect(() => {
		if (error) {
			dispatch(setError(error));
		}
	}, [error, dispatch]);

	// Blank the panel the moment a new snapshot is selected (before paint, so the
	// empty furniture/labels never flash while the new content loads). It stays
	// hidden until the fetch resolves and the fade-in effect below runs.
	useLayoutEffect(() => {
		if (!activeSnapshot) {
			return;
		}
		setIsSettingContent(true);
	}, [activeSnapshot]);

	// Fade in newly loaded content and reset the copy label, mirroring
	// `displayContent`.
	useEffect(() => {
		if (!content || !activeSnapshot) {
			return;
		}
		setCopyLabel(COPY_LABEL);
		setIsSettingContent(true);
		const timer = window.setTimeout(() => setIsSettingContent(false), FADE_MS);

		return () => window.clearTimeout(timer);
	}, [content, activeSnapshot]);

	const toggleJson = (): void => {
		dispatch(isShowingJSON ? showHtml() : showJson());
	};

	const restore = (): void => {
		dispatch(openModal());
	};

	const copyJson = (): void => {
		if (!content) {
			return;
		}
		void copyToClipboard(content.json).then(() => setCopyLabel(COPIED_LABEL));
	};

	return {
		content,
		isShowingJSON,
		isSettingContent,
		copyLabel,
		canRestore,
		toggleJson,
		restore,
		copyJson,
	};
};

export { useSnapshotContent };
export type { UseSnapshotContent };
