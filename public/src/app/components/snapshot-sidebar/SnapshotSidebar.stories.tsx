import preview from '#.storybook/preview';
import { mockContentId } from '../storybook/mockData';
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
