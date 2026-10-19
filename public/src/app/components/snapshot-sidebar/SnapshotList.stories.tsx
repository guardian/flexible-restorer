import { fn } from 'storybook/test';
import preview from '#.storybook/preview';
import { mockSnapshots } from '../storybook/mockData';
import { SnapshotList } from './SnapshotList';

const meta = preview.meta({
	component: SnapshotList,
	args: {
		snapshots: mockSnapshots,
		activeIndex: 0,
		onSelect: fn(),
	},
});

export const Default = meta.story();
