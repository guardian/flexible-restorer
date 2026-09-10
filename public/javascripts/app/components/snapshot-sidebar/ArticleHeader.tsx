/** @jsxImportSource @emotion/react */
import type { FunctionComponent } from 'react';
import { css } from '@emotion/react';
import type { SnapshotIdViewModel } from '../models/snapshotId';
import { palette } from '../styles/palette';

const headerFixed = css({ flexShrink: 0 });

// --- article header (from text.scss) ---
const articleHeadline = css({
	fontFamily: '"Guardian Egyptian Text"',
	fontWeight: 'bold',
	fontSize: '18px',
	lineHeight: '23px',
	marginBottom: 0,
});

const articleHash = css({
	marginBottom: '20px',
	fontFamily: '"Guardian Agate Sans"',
	fontWeight: 'normal',
	fontSize: '13px',
	lineHeight: '18px',
	a: {
		textDecoration: 'none',
		color: palette.link,
	},
});

// --- list header row (from snapshot-list.scss) ---
const listHeader = css({
	display: 'flex',
	flexDirection: 'row',
	background: palette.boxTertiary,
	fontFamily: '"Guardian Agate Sans"',
	fontWeight: 'bold',
	fontSize: '12px',
	textTransform: 'uppercase',
});

const listHeaderDecal = css({
	boxSizing: 'border-box',
	flexBasis: '46px',
	maxWidth: '46px',
	padding: '5px 10px',
	borderRight: `1px solid ${palette.grey400}`,
});

const listHeaderContent = css({
	padding: '5px 10px',
	flexBasis: '175px',
	borderRight: `1px solid ${palette.grey400}`,
});

const listHeaderStatus = css({ padding: '5px 10px' });

type ArticleHeaderProps = {
	/** The currently-active snapshot, whose metadata heads the sidebar. */
	activeSnapshot: SnapshotIdViewModel;
};

/**
 * Headline + content-id link + column headings shown above the snapshot list.
 * Migrated from the `scrollable__header-fixed` block of restore-list.html; the
 * article fields previously came from `SnapshotListCtrl` scope but are now
 * derived from the active snapshot.
 */
const ArticleHeader: FunctionComponent<ArticleHeaderProps> = ({
	activeSnapshot,
}) => (
	<div css={headerFixed}>
		<h1 css={articleHeadline}>{activeSnapshot.headline}</h1>
		<h6 css={articleHash}>
			(
			<a href={activeSnapshot.composerUrl} target="_blank" rel="noreferrer">
				{activeSnapshot.contentId}
			</a>
			)
		</h6>
		<div css={listHeader}>
			<span css={listHeaderDecal} title="Content revision number">
				No.
			</span>
			<span css={listHeaderContent}>Snapped at &amp; last modified</span>
			<span css={listHeaderStatus}>Status</span>
		</div>
	</div>
);

export { ArticleHeader };
export type { ArticleHeaderProps };
