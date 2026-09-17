import { useEffect, useRef } from 'react';
import type { SnapshotIdViewModel } from '../models/snapshotId';
import {
	useActiveIndex,
	useAppDispatch,
	useIsModalOpen,
} from '../store/hooks';
import { openModal, setActiveIndex, showHtml, showJson } from '../store/viewerSlice';

type UseSnapshotKeyboardNavParams = {
	snapshots: SnapshotIdViewModel[] | undefined;
};

/**
 * Keyboard navigation for the snapshot sidebar, mirroring the legacy
 * `SnapshotListInteractionCtrl`. Arrow up/down move the active selection, while
 * Enter/left/right drive the content panel and restore modal — all via the Redux
 * viewer slice.
 *
 * The listener is registered once  on mount — before the version list has
 * finished loading — so a keypress issued as soon as the page is interactive is
 * never missed while waiting for the fetch to resolve or for a re-render to
 * re-bind it. Live state is read through a ref rather than a stale closure.
 */
const useSnapshotKeyboardNav = ({
	snapshots,
}: UseSnapshotKeyboardNavParams): void => {
	const dispatch = useAppDispatch();
	const activeIndex = useActiveIndex();
	const isModalOpen = useIsModalOpen();

	const latest = useRef({ snapshots, activeIndex, isModalOpen });
	latest.current = { snapshots, activeIndex, isModalOpen };

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent): void => {
			const {
				snapshots: currentSnapshots,
				activeIndex: currentIndex,
				isModalOpen: modalOpen,
			} = latest.current;
			switch (event.key) {
				case 'ArrowDown':
					// Arrow navigation moves the active selection, so it needs the
					// loaded list; the other shortcuts drive the content panel/modal
					// and must work as soon as the page is interactive.
					if (!modalOpen && currentSnapshots) {
						event.preventDefault();
						const lastIndex = currentSnapshots.length - 1;
						const next = Math.min(currentIndex + 1, lastIndex);
						dispatch(setActiveIndex(next));
					}
					break;
				case 'ArrowUp':
					if (!modalOpen && currentSnapshots) {
						event.preventDefault();
						const previous = Math.max(currentIndex - 1, 0);
						dispatch(setActiveIndex(previous));
					}
					break;
				case 'Enter':
					if (!modalOpen) {
						event.preventDefault();
						dispatch(openModal());
					}
					break;
				case 'ArrowLeft':
					event.preventDefault();
					if (!modalOpen) {
						dispatch(showHtml());
					}
					break;
				case 'ArrowRight':
					event.preventDefault();
					if (!modalOpen) {
						dispatch(showJson());
					}
					break;
				default:
					break;
			}
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [dispatch]);
};

export { useSnapshotKeyboardNav };
