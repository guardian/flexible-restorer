import { http, HttpResponse } from 'msw';
import { mockContentId } from '#.storybook/mockData';
import preview from '#.storybook/preview';
import { SnapshotSidebar } from './SnapshotSidebar';

const meta = preview.meta({
	component: SnapshotSidebar,
	args: { contentId: mockContentId },
	parameters: { layout: 'fullscreen' },
	decorators: [
		(Story) => (
			<div style={{ height: '100vh', width: '400px' }}>
				<Story />
			</div>
		),
	],
});

export const Default = meta.story();

export const NoSnapshots = meta.story({
	beforeEach({ msw }) {
		msw.use(
			http.get('/api/1/versionList/:contentId', () =>
				HttpResponse.json([]),
			),
		);
	},
});
