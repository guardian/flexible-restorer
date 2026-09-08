/** @jsxImportSource @emotion/react */
import type { FunctionComponent } from 'react';
import { useEffect, useState } from 'react';
import { css } from '@emotion/react';
import { useSnapshotList } from '../hooks/useSnapshotList';
import {
	useSnapshotKeyboardNav,
	type DisplayState,
} from '../hooks/useSnapshotKeyboardNav';
import {
	publishDisplayHtml,
	publishSetActive,
	subscribeHiddenModal,
} from '../utils/mediator';
import { palette } from '../styles/palette';
import { ArticleHeader } from './ArticleHeader';
import { SnapshotList } from './SnapshotList';

// --- sidebar shell (from sidebar.scss + box.scss "secondary" + scrollable.scss) ---
const sidebar = (isActive: boolean) =>
	css({
		boxSizing: 'border-box',
		display: 'flex',
		flexDirection: 'column',
		padding: '10px',
		backgroundColor: palette.boxSecondary,
		borderRight: `1px solid ${palette.grey300}`,
		overflow: 'auto',
		maxHeight: '100%',
		height: '100%',
		transform: isActive
			? 'translateX(0)'
			: 'translateZ(0) translateX(-110%)',
		transition: 'transform 1s',
		transitionDelay: '.3s',
	});

const scrollableContainer = css({
	display: 'flex',
	flexDirection: 'column',
	maxHeight: '100%',
});

const scrollableBody = css({ flexGrow: 1, overflowY: 'auto' });

type SnapshotSidebarProps = {
	/** Content id from the Angular route, bound via react2angular (see ../index.js). */
	contentId: string;
};

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

	useSnapshotKeyboardNav({
		snapshots,
		activeIndex,
		displayState,
		setActiveIndex,
		setDisplayState,
	});

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
		<div css={sidebar(isSlidIn)}>
			<div css={scrollableContainer}>
				<ArticleHeader activeSnapshot={activeSnapshot} />
				<div css={scrollableBody} data-testid="snapshot-list-scroll">
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
