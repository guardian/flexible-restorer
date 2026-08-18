/** @jsxImportSource @emotion/react */
import type { FunctionComponent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSnapshotList } from '../hooks/useSnapshotList';
import {
	publishDisplayHtml,
	publishDisplayJson,
	publishDisplayModal,
	publishSetActive,
	subscribeHiddenModal,
} from '../utils/mediator';
import { ArticleHeader } from './ArticleHeader';
import { SnapshotList } from './SnapshotList';
import { styles } from './styles';

type SnapshotSidebarProps = {
	/** Content id from the Angular route, bound via react2angular (see ../index.js). */
	contentId: string;
};

// Which view the (still-Angular) content panel is showing. Tracked here so
// keyboard navigation can be suppressed while the restore modal is open, exactly
// as the legacy `SnapshotListInteractionCtrl` did.
type DisplayState = 'html' | 'json' | 'modal';

// Delay before the sidebar slides in, matching the legacy `$timeout(..., 500)`
// in SnapshotListCtrl.
const SLIDE_IN_DELAY_MS = 500;

/**
 * Snapshot sidebar: article header + version list + click/keyboard interaction.
 *
 * Migrated from the `gu-column.sidebar` block of restore-list.html and the
 * `SnapshotListCtrl` / `SnapshotListInteractionCtrl` controllers. React owns the
 * active selection and broadcasts `snapshot-list:*` mediator events so the
 * remaining Angular controllers (content panel, restore modal, analytics) keep
 * working unchanged.
 */
const SnapshotSidebar: FunctionComponent<SnapshotSidebarProps> = ({
	contentId,
}) => {
	const { snapshots, error } = useSnapshotList(contentId);
	const [activeIndex, setActiveIndex] = useState(0);
	const [displayState, setDisplayState] = useState<DisplayState>('html');
	const [isSlidIn, setIsSlidIn] = useState(false);

	// Latest state for the keydown handler, which is registered once on mount
	// (see below) and therefore must read live values through a ref rather than
	// a stale closure.
	const latest = useRef({ snapshots, activeIndex, displayState });
	latest.current = { snapshots, activeIndex, displayState };

	// Slide the sidebar in shortly after mount.
	useEffect(() => {
		const timer = window.setTimeout(
			() => setIsSlidIn(true),
			SLIDE_IN_DELAY_MS,
		);
		return () => window.clearTimeout(timer);
	}, []);

	// Reset to the HTML view whenever the restore modal closes.
	useEffect(() => subscribeHiddenModal(() => setDisplayState('html')), []);

	// Keyboard navigation, mirroring SnapshotListInteractionCtrl. The listener is
	// registered once on mount — before the version list has finished loading —
	// so a keypress issued as soon as the page is interactive is never missed
	// while waiting for the fetch to resolve or for a re-render to re-bind it.
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent): void => {
			const {
				snapshots: currentSnapshots,
				activeIndex: currentIndex,
				displayState: currentDisplay,
			} = latest.current;
			const modalOpen = currentDisplay === 'modal';
			switch (event.key) {
				case 'ArrowDown':
					// Arrow navigation moves React's active selection, so it needs
					// the loaded list; the other shortcuts drive Angular-owned
					// panels/modal and must work as soon as the page is interactive.
					if (!modalOpen && currentSnapshots) {
						event.preventDefault();
						const lastIndex = currentSnapshots.length - 1;
						const next = Math.min(currentIndex + 1, lastIndex);
						setActiveIndex(next);
						publishSetActive(next);
					}
					break;
				case 'ArrowUp':
					if (!modalOpen && currentSnapshots) {
						event.preventDefault();
						const previous = Math.max(currentIndex - 1, 0);
						setActiveIndex(previous);
						publishSetActive(previous);
					}
					break;
				case 'Enter':
					if (!modalOpen) {
						event.preventDefault();
						setDisplayState('modal');
						publishDisplayModal();
					}
					break;
				case 'ArrowLeft':
					event.preventDefault();
					if (!modalOpen) {
						setDisplayState('html');
						publishDisplayHtml();
					}
					break;
				case 'ArrowRight':
					event.preventDefault();
					if (!modalOpen) {
						setDisplayState('json');
						publishDisplayJson();
					}
					break;
				default:
					break;
			}
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, []);

	const handleSelect = (index: number): void => {
		setDisplayState('html');
		publishDisplayHtml();
		setActiveIndex(index);
		publishSetActive(index);
	};

	// The loading state is covered by the surrounding Angular `gu-loading-bars`,
	// and fetch failures are surfaced by the Angular error modal, so render
	// nothing until the list is available.
	if (error || !snapshots) {
		return null;
	}

	const activeSnapshot = snapshots[activeIndex] ?? snapshots[0];
	if (!activeSnapshot) {
		return null;
	}

	return (
		<div css={styles.sidebar(isSlidIn)}>
			<div css={styles.scrollableContainer}>
				<ArticleHeader activeSnapshot={activeSnapshot} />
				<div css={styles.scrollableBody}>
					<SnapshotList
						snapshots={snapshots}
						activeIndex={activeIndex}
						onSelect={handleSelect}
					/>
				</div>
			</div>
		</div>
	);
};

export { SnapshotSidebar };
export type { SnapshotSidebarProps };
