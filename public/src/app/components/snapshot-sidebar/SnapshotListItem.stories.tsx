import { fn } from 'storybook/test';
import { mockSnapshots } from '#.storybook/mockData';
import preview from '#.storybook/preview';
import type { SnapshotIdViewModel } from '../models/snapshotId';
import { formatLongDate } from '../utils/dateFormat';
import { SnapshotListItem } from './SnapshotListItem';

// A snapshot with every optional status off, so each variant shows one field in isolation.
const plain: SnapshotIdViewModel = {
	...mockSnapshots[0]!,
	snapshotReason: 'Periodic snapshot',
	becauseOfLaunch: false,
	legallySensitive: false,
	comments: { defined: undefined, on: false },
	publishedState: '',
};

const meta = preview.meta({
	component: SnapshotListItem,
	args: {
		snapshot: mockSnapshots[0]!,
		fallbackRevision: 1,
		isActive: false,
		onSelect: fn(),
	},
	decorators: [
		(Story) => (
			<ol style={{ listStyle: 'none', paddingLeft: 0 }}>
				<Story />
			</ol>
		),
	],
});

export const Default = meta.story();

export const Plain = meta.story({ args: { snapshot: plain } });

export const Active = meta.story({
	args: { snapshot: plain, isActive: true },
});

export const BecauseOfLaunch = meta.story({
	args: {
		snapshot: {
			...plain,
			snapshotReason: 'Published',
			becauseOfLaunch: true,
		},
	},
});

export const LegallySensitive = meta.story({
	args: { snapshot: { ...plain, legallySensitive: true } },
});

export const CommentsOn = meta.story({
	args: { snapshot: { ...plain, comments: { defined: 'true', on: true } } },
});

export const CommentsOff = meta.story({
	args: {
		snapshot: { ...plain, comments: { defined: 'false', on: false } },
	},
});

export const Published = meta.story({
	args: { snapshot: { ...plain, publishedState: 'Published' } },
});

export const TakenDown = meta.story({
	args: { snapshot: { ...plain, publishedState: 'Taken down' } },
});

export const Scheduled = meta.story({
	args: {
		snapshot: {
			...plain,
			publishedState: `Scheduled  ${formatLongDate(new Date('2026-07-01T09:00:00Z'))}`,
		},
	},
});

export const Embargoed = meta.story({
	args: {
		snapshot: {
			...plain,
			publishedState: `Embargoed until ${formatLongDate(new Date('2026-07-01T09:00:00Z'))}`,
		},
	},
});

export const NoRevisionId = meta.story({
	args: {
		snapshot: { ...plain, revisionId: undefined },
		fallbackRevision: 7,
	},
});

export const NoReason = meta.story({
	args: { snapshot: { ...plain, snapshotReason: undefined } },
});

export const UnknownUser = meta.story({
	args: { snapshot: { ...plain, userEmail: '-' } },
});

export const RecentSnapshot = meta.story({
	args: { snapshot: { ...plain, createdDate: new Date() } },
});

export const AllStatuses = meta.story({
	args: {
		snapshot: {
			...plain,
			snapshotReason: 'Published',
			becauseOfLaunch: true,
			legallySensitive: true,
			comments: { defined: 'true', on: true },
			publishedState: 'Published',
		},
		isActive: true,
	},
});
