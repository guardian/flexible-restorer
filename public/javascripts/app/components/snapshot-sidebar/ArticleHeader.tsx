/** @jsxImportSource @emotion/react */
import type { FunctionComponent } from 'react';
import type { SnapshotIdViewModel } from '../models/snapshotId';
import { styles } from './styles';

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
	<div css={styles.headerFixed}>
		<h1 css={styles.articleHeadline}>{activeSnapshot.headline}</h1>
		<h6 css={styles.articleHash}>
			(
			<a href={activeSnapshot.composerUrl} target="_blank" rel="noreferrer">
				{activeSnapshot.contentId}
			</a>
			)
		</h6>
		<div css={styles.listHeader}>
			<span css={styles.listHeaderDecal} title="Content revision number">
				No.
			</span>
			<span css={styles.listHeaderContent}>Snapped at &amp; last modified</span>
			<span css={styles.listHeaderStatus}>Status</span>
		</div>
	</div>
);

export { ArticleHeader };
export type { ArticleHeaderProps };
