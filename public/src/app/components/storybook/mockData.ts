import earlierSnapshot from '../../../../../e2e-tests/fixtures/snapshots/6aa258d98f080f2ddaddc8dd/2026-09-10T23:02:47.676Z.json';
import earlierInfo from '../../../../../e2e-tests/fixtures/snapshots/6aa258d98f080f2ddaddc8dd/2026-09-10T23:02:47.676Z.info.json';
import latestSnapshot from '../../../../../e2e-tests/fixtures/snapshots/6aa258d98f080f2ddaddc8dd/2026-09-11T01:32:39.779Z.json';
import latestInfo from '../../../../../e2e-tests/fixtures/snapshots/6aa258d98f080f2ddaddc8dd/2026-09-11T01:32:39.779Z.info.json';
import type { RestoreDestination } from '../api/fetchRestoreDestinations';
import type { User } from '../api/fetchUser';
import type { RawSnapshot } from '../models/snapshotContent';
import { parseSnapshotContent } from '../models/snapshotContent';
import type { RawSnapshotId } from '../models/snapshotId';
import { parseSnapshotList } from '../models/snapshotId';

export const mockContentId = '6aa258d98f080f2ddaddc8dd';

const primarySystem = {
	id: 'composer',
	isSecondary: false,
	composerPrefix: 'https://composer.local.dev-gutools.co.uk',
};

const secondarySystem = {
	id: 'composer-secondary',
	isSecondary: true,
	composerPrefix: 'https://composer-secondary.local.dev-gutools.co.uk',
};

const latestTimestamp = '2026-09-11T01_32_39.779Z';
const earlierTimestamp = '2026-09-10T23_02_47.676Z';

export const mockRawSnapshotList: RawSnapshotId[] = [
	{
		contentId: mockContentId,
		timestamp: latestTimestamp,
		system: primarySystem,
		info: latestInfo,
	},
	{
		contentId: mockContentId,
		timestamp: earlierTimestamp,
		system: primarySystem,
		info: earlierInfo,
	},
	{
		contentId: mockContentId,
		timestamp: earlierTimestamp,
		system: secondarySystem,
		info: earlierInfo,
	},
];

export const mockSnapshots = parseSnapshotList(mockRawSnapshotList);

export const mockRawSnapshots: Record<string, RawSnapshot> = {
	[latestTimestamp]: latestSnapshot,
	[earlierTimestamp]: earlierSnapshot,
};

export const mockRawSnapshot: RawSnapshot = latestSnapshot;

export const mockSnapshotContent = parseSnapshotContent(mockRawSnapshot);

export const mockUser: User = {};

export const mockPermissions: NonNullable<User['permissions']> = {
	restore_content: true,
	restore_content_to_any_stack: true,
};

export const mockRestoreDestinations: RestoreDestination[] = [
	{
		systemId: primarySystem.id,
		displayName: 'Composer',
		available: true,
		composerPrefix: primarySystem.composerPrefix,
		changeDetails: {
			revisionId: latestInfo.summary.contentChangeDetails.revision,
			lastModified: new Date(
				latestInfo.summary.contentChangeDetails.lastModified.date,
			).toISOString(),
		},
	},
	{
		systemId: secondarySystem.id,
		displayName: 'Composer secondary',
		available: true,
		composerPrefix: secondarySystem.composerPrefix,
		changeDetails: null,
	},
];
