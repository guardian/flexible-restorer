/** @jsxImportSource @emotion/react */
import type { FunctionComponent } from 'react';
import { useEffect, useState } from 'react';
import { css } from '@emotion/react';
import { useSnapshotKeyboardNav } from '../hooks/useSnapshotKeyboardNav';
import { useGetSnapshotListQuery } from '../store/restorerApi';
import { useActiveIndex, useAppDispatch } from '../store/hooks';
import { setActiveIndex, setError, showHtml } from '../store/viewerSlice';
import { palette } from '../styles/palette';
import { ArticleHeader } from './ArticleHeader';
import { SnapshotList } from './SnapshotList';

// --- sidebar shell ---
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

export type SnapshotSidebarProps = {
	/** Content id parsed from the application route. */
	contentId: string;
};

// Delay before the sidebar slides in to preserve the legacy interaction.
const SLIDE_IN_DELAY_MS = 500;

/**
 * Snapshot sidebar: article header + version list + click/keyboard interaction.
 *
 * Migrated from the legacy sidebar and list controllers. The active selection
 * lives in the Redux viewer slice, shared with the content viewer and restore
 * modal.
 */
export const SnapshotSidebar: FunctionComponent<SnapshotSidebarProps> = ({
	contentId,
}) => {
	const { data: snapshots, error } = useGetSnapshotListQuery(contentId);
	const dispatch = useAppDispatch();
	const activeIndex = useActiveIndex();
	const [isSlidIn, setIsSlidIn] = useState(false);

	// Slide the sidebar in shortly after mount.
	useEffect(() => {
		const timer = window.setTimeout(
			() => setIsSlidIn(true),
			SLIDE_IN_DELAY_MS,
		);
		return () => window.clearTimeout(timer);
	}, []);

	// Surface a version-list fetch failure (e.g. no snapshots) in the error modal.
	useEffect(() => {
		if (error) {
			dispatch(setError(error));
		}
	}, [error, dispatch]);

	useSnapshotKeyboardNav({ snapshots });

	const handleSelect = (index: number): void => {
		dispatch(showHtml());
		dispatch(setActiveIndex(index));
	};

	// The loading state is covered by the surrounding React shell, and fetch
	// failures are surfaced by the React error modal, so render
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

