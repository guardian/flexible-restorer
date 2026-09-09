import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { useSnapshotList } from './useSnapshotList';
import { fetchSnapshot, snapshotUrl } from '../api/fetchSnapshot';
import type { SnapshotRef } from '../api/fetchSnapshot';
import { fetchUser } from '../api/fetchUser';
import type { SnapshotContent } from '../models/snapshotContent';
import { parseSnapshotContent } from '../models/snapshotContent';
import {
	publishDisplayHtml,
	publishDisplayJson,
	publishDisplayModal,
	publishError,
	publishSnapshotViewed,
	subscribeDisplayHtml,
	subscribeDisplayJson,
	subscribeHiddenModal,
	subscribeLoadContent,
} from '../utils/mediator';

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

// Prefer the async Clipboard API (the modern, standard approach), falling back
// to a hidden textarea + `execCommand` for non-secure contexts where
// `navigator.clipboard` is unavailable.
const copyToClipboard = async (text: string): Promise<void> => {
	if (window.isSecureContext && navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text);
		return;
	}
	const textarea = document.createElement('textarea');
	textarea.value = text;
	document.body.appendChild(textarea);
	textarea.focus();
	textarea.select();
	document.execCommand('copy');
	document.body.removeChild(textarea);
};

/**
 * Drives the React snapshot content viewer, porting `SnapshotContentCtrl`.
 *
 * The still-Angular `SnapshotListCtrl` remains authoritative for the active
 * selection: this hook loads the initial (index 0) snapshot itself, then follows
 * `snapshot-list:load-content` for subsequent selections. The HTML/JSON toggle
 * round-trips through the mediator (matching the legacy controller) so the
 * sidebar's keyboard navigation stays in sync.
 */
const useSnapshotContent = (contentId: string): UseSnapshotContent => {
	const { snapshots } = useSnapshotList(contentId);
	const [selected, setSelected] = useState<SnapshotRef | undefined>();
	const [isShowingJSON, setIsShowingJSON] = useState(false);
	const [isSettingContent, setIsSettingContent] = useState(false);
	const [copyLabel, setCopyLabel] = useState(COPY_LABEL);
	const [canRestore, setCanRestore] = useState(false);
	const hasTrackedView = useRef(false);

	// Set the initial selection from the first snapshot once the list arrives.
	useEffect(() => {
		if (selected || !snapshots || snapshots.length === 0) {
			return;
		}
		const first = snapshots[0];
		if (!first) {
			return;
		}
		setSelected({
			systemId: first.systemId,
			contentId: first.contentId,
			timestamp: first.timestamp,
		});
	}, [snapshots, selected]);

	// Follow selection changes broadcast by the Angular sidebar controller.
	useEffect(
		() =>
			subscribeLoadContent((systemId, loadedContentId, timestamp) =>
				setSelected({
					systemId,
					contentId: loadedContentId,
					timestamp,
				}),
			),
		[],
	);

	// Keep the HTML/JSON view in sync with the sidebar and the restore modal.
	useEffect(() => subscribeDisplayHtml(() => setIsShowingJSON(false)), []);
	useEffect(() => subscribeDisplayJson(() => setIsShowingJSON(true)), []);
	useEffect(() => subscribeHiddenModal(() => setIsShowingJSON(false)), []);

	// Resolve whether the current user may restore content.
	useEffect(() => {
		let cancelled = false;
		fetchUser()
			.then((user) => {
				if (!cancelled) {
					setCanRestore(user.permissions?.restore_content === true);
				}
			})
			.catch((error: unknown) => publishError(error));
		return () => {
			cancelled = true;
		};
	}, []);

	const { data: content, error } = useSWR<SnapshotContent, Error>(
		selected ? snapshotUrl(selected.systemId, selected.contentId, selected.timestamp) : null,
		() => fetchSnapshot(selected!).then(parseSnapshotContent),
		{ revalidateOnFocus: false },
	);

	useEffect(() => {
		if (error) {
			publishError(error);
		}
	}, [error]);

	// Fade in newly loaded content and reset the copy label, mirroring
	// `displayContent`. Fire the "Viewed" analytics event once, on first load.
	useEffect(() => {
		if (!content || !selected) {
			return;
		}
		setCopyLabel(COPY_LABEL);
		setIsSettingContent(true);
		const timer = window.setTimeout(() => setIsSettingContent(false), FADE_MS);

		if (!hasTrackedView.current) {
			hasTrackedView.current = true;
			publishSnapshotViewed(selected.contentId, selected.timestamp);
		}

		return () => window.clearTimeout(timer);
	}, [content, selected]);

	const toggleJson = (): void => {
		if (isShowingJSON) {
			publishDisplayHtml();
		} else {
			publishDisplayJson();
		}
	};

	const restore = (): void => publishDisplayModal();

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
