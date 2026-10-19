import type { RestoreDestination } from '../api/fetchRestoreDestinations';
import type { User } from '../api/fetchUser';
import type { RawSnapshot } from '../models/snapshotContent';
import { parseSnapshotContent } from '../models/snapshotContent';
import type { RawSnapshotId } from '../models/snapshotId';
import { parseSnapshotList } from '../models/snapshotId';

export const mockContentId = '5a65beade4b063d00a114104';

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

const lastModifiedBy = { user: { firstName: 'Jane', lastName: 'Smith' } };

export const mockRawSnapshotList: RawSnapshotId[] = [
	{
		contentId: mockContentId,
		timestamp: '2026-06-26T11_26_27.839Z',
		system: primarySystem,
		info: {
			metadata: { reason: 'Published' },
			summary: {
				published: true,
				preview: {
					fields: { headline: 'Storybook arrives at the restorer' },
					settings: { commentable: 'true' },
				},
				contentChangeDetails: {
					revision: 3,
					lastModified: lastModifiedBy,
				},
			},
		},
	},
	{
		contentId: mockContentId,
		timestamp: '2026-06-25T09_12_00.000Z',
		system: primarySystem,
		info: {
			metadata: { reason: 'Periodic snapshot' },
			summary: {
				preview: {
					fields: { headline: 'Storybook arrives at the restorer' },
					settings: {
						legallySensitive: 'true',
						commentable: 'false',
					},
				},
				contentChangeDetails: {
					revision: 2,
					lastModified: lastModifiedBy,
				},
			},
		},
	},
	{
		contentId: mockContentId,
		timestamp: '2026-06-20T16_45_10.000Z',
		system: secondarySystem,
		info: {
			metadata: { reason: 'Periodic snapshot' },
			summary: {
				preview: {
					fields: {
						headline: 'Storybook arrives at the restorer (draft)',
					},
				},
				contentChangeDetails: {
					revision: 1,
					lastModified: lastModifiedBy,
				},
			},
		},
	},
];

export const mockSnapshots = parseSnapshotList(mockRawSnapshotList);

export const mockRawSnapshot: RawSnapshot = {
	preview: {
		fields: {
			headline: 'Storybook arrives at the restorer',
			standfirst: 'Every component now has a home of its own',
			trailText: 'Components, isolated',
		},
		blocks: [
			{
				elements: [
					{
						fields: {
							text: '<p>This is a <strong>paragraph</strong> of article body text.</p>',
						},
					},
					{
						fields: {
							items: [
								{
									title: 'Key takeaway',
									content: [
										{
											fields: {
												text: '<p>List item content.</p>',
											},
										},
									],
								},
							],
						},
					},
					{
						fields: {
							sections: [
								{
									title: 'Timeline',
									events: [
										{
											title: 'Event',
											date: '26 June 2026',
											body: [
												{
													fields: {
														text: '<p>Event body.</p>',
													},
												},
											],
										},
									],
								},
							],
						},
					},
				],
			},
		],
	},
};

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
			revisionId: 3,
			lastModified: '2026-06-26T11:26:27.839Z',
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
