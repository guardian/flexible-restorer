/** @jsxImportSource @emotion/react */
import type { FunctionComponent } from 'react';
import { Fragment } from 'react';
import type { SnapshotIdViewModel } from '../models/snapshotId';
import { deltaFrom } from '../models/snapshotId';
import { SnapshotListItem } from './SnapshotListItem';
import { DeltaRow } from './DeltaRow';
import { styles } from './styles';

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
	<ol css={styles.list}>
		{snapshots.map((snapshot, index) => (
			<Fragment key={`${snapshot.systemId}-${snapshot.timestamp}`}>
				{snapshot.isSecondary && (
					<li css={styles.secondaryBanner}>
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
