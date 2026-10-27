import { useEffect, useRef } from 'react';
import type { SnapshotIdViewModel } from '../models/snapshotId';
import { useActiveIndex, useAppDispatch, useIsModalOpen } from '../store/hooks';
import {
	openModal,
	setActiveIndex,
	showHtml,
	showJson,
} from '../store/viewerSlice';

type UseSnapshotKeyboardNavParams = {
	snapshots: SnapshotIdViewModel[] | undefined;
};

/**
 * Arrow up/down move the active selection; Enter opens the restore modal and
 * left/right switch the content view through the Redux viewer slice.
 *
 * Register the listener on mount so the modal and view shortcuts work while the
 * version list loads; only up/down navigation needs the loaded list. Read live
 * state through a ref to avoid stale closures and rebinding on each render.
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
