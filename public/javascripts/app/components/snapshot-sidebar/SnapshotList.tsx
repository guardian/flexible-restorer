/** @jsxImportSource @emotion/react */
import type { FunctionComponent } from 'react';
import { Fragment } from 'react';
import { css } from '@emotion/react';
import type { SnapshotIdViewModel } from '../models/snapshotId';
import { deltaFrom } from '../models/snapshotId';
import { palette } from '../styles/palette';
import { SnapshotListItem } from './SnapshotListItem';
import { DeltaRow } from './DeltaRow';

// --- list (from index-list mixins + snapshot-list.scss) ---
const list = css({
	marginTop: '5px',
	paddingLeft: 0,
	li: { listStyle: 'none' },
});

const secondaryBanner = css({
	color: 'white',
	background: palette.secondaryBanner,
	padding: '2px',
	fontFamily: '"Guardian Agate Sans"',
	fontWeight: 'bold',
	fontSize: '12px',
	textTransform: 'uppercase',
});

type SnapshotListProps = {
	snapshots: SnapshotIdViewModel[];
	activeIndex: number;
	onSelect: (index: number) => void;
};

/**
 * The ordered snapshot list: an optional "from composer-secondary" banner, the
 * item row and the delta row, per snapshot. Migrated from the `snapshot-list`
 * `ng-repeat` in restore-list.html.
 */
const SnapshotList: FunctionComponent<SnapshotListProps> = ({
	snapshots,
	activeIndex,
	onSelect,
}) => (
	<ol css={list}>
		{snapshots.map((snapshot, index) => (
			<Fragment key={`${snapshot.systemId}-${snapshot.timestamp}`}>
				{snapshot.isSecondary && (
					<li css={secondaryBanner}>
						This snapshot came from composer-secondary
					</li>
				)}
				<SnapshotListItem
					snapshot={snapshot}
					fallbackRevision={snapshots.length - index}
					isActive={index === activeIndex}
					onSelect={() => onSelect(index)}
				/>
				<DeltaRow label={deltaFrom(snapshot, snapshots[index + 1])} />
			</Fragment>
		))}
	</ol>
);

export { SnapshotList };
export type { SnapshotListProps };
