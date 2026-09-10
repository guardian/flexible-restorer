import { useEffect, useRef } from 'react';
import type { SnapshotIdViewModel } from '../models/snapshotId';
import {
	publishDisplayHtml,
	publishDisplayJson,
	publishDisplayModal,
	publishSetActive,
} from '../utils/mediator';

// Which view the (still-Angular) content panel is showing. Tracked so keyboard
// navigation can be suppressed while the restore modal is open, exactly as the
// legacy `SnapshotListInteractionCtrl` did.
type DisplayState = 'html' | 'json' | 'modal';

type UseSnapshotKeyboardNavParams = {
	snapshots: SnapshotIdViewModel[] | undefined;
	activeIndex: number;
	displayState: DisplayState;
	setActiveIndex: (index: number) => void;
	setDisplayState: (state: DisplayState) => void;
};

/**
 * Keyboard navigation for the snapshot sidebar, mirroring the legacy
 * `SnapshotListInteractionCtrl`. Arrow up/down move React's active selection,
 * while Enter/left/right drive the Angular-owned content panel and restore modal
 * via mediator events.
 *
 * The listener is registered once on mount — before the version list has
 * finished loading — so a keypress issued as soon as the page is interactive is
 * never missed while waiting for the fetch to resolve or for a re-render to
 * re-bind it. Live state is read through a ref rather than a stale closure.
 */
const useSnapshotKeyboardNav = ({
	snapshots,
	activeIndex,
	displayState,
	setActiveIndex,
	setDisplayState,
}: UseSnapshotKeyboardNavParams): void => {
	const latest = useRef({ snapshots, activeIndex, displayState });
	latest.current = { snapshots, activeIndex, displayState };

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
	}, [setActiveIndex, setDisplayState]);
};

export { useSnapshotKeyboardNav };
export type { DisplayState };
