import { skipToken } from '@reduxjs/toolkit/query/react';
import { useEffect, useLayoutEffect, useState } from 'react';
import type { SnapshotContent } from '../models/snapshotContent';
import { useActiveIndex, useAppDispatch, useContentView } from '../store/hooks';
import {
	useGetSnapshotListQuery,
	useGetSnapshotQuery,
	useGetUserQuery,
} from '../store/restorerApi';
import { openModal, setError, showHtml, showJson } from '../store/viewerSlice';

const COPY_LABEL = 'Copy JSON';
const COPIED_LABEL = 'Copied!';

const FADE_MS = 200;

type UseSnapshotContent = {
	content: SnapshotContent | undefined;
	isShowingJSON: boolean;
	isSettingContent: boolean;
	copyLabel: string;
	canRestore: boolean;
	toggleJson: () => void;
	restore: () => void;
	copyJson: () => void;
};

// Clipboard access requires a secure context; there is no fallback.
const copyToClipboard = async (text: string): Promise<void> => {
	// `navigator.clipboard` is absent at runtime in non-secure contexts, despite the types.
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime guard for non-secure contexts
	if (window.isSecureContext && navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text);
		return;
	}
};

/**
 * Loads the selected snapshot and controls its content view.
 *
 * The active selection lives in the Redux viewer slice (owned by the
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

	const { data: content, error } = useGetSnapshotQuery(
		activeSnapshot ?? skipToken,
	);

	useEffect(() => {
		if (error) {
			dispatch(setError(error));
		}
	}, [error, dispatch]);

	// Hide the panel before paint when the selection changes, preventing a flash
	// of old content or empty furniture. The effect below schedules its reveal
	// when content is available.
	useLayoutEffect(() => {
		if (!activeSnapshot) {
			return;
		}
		setIsSettingContent(true);
	}, [activeSnapshot]);

	// Fade in content and reset the copy label when the selection or data changes.
	useEffect(() => {
		if (!content || !activeSnapshot) {
			return;
		}
		setCopyLabel(COPY_LABEL);
		setIsSettingContent(true);
		const timer = window.setTimeout(
			() => setIsSettingContent(false),
			FADE_MS,
		);

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
		void copyToClipboard(content.json).then(() =>
			setCopyLabel(COPIED_LABEL),
		);
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
