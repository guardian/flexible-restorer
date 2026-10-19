import preview from '#.storybook/preview';
import { mockContentId } from '../storybook/mockData';
import { VersionsView } from './VersionsView';

const meta = preview.meta({
	component: VersionsView,
	args: { contentId: mockContentId },
	parameters: { layout: 'fullscreen' },
	decorators: [
		(Story) => (
			<div style={{ height: '100vh' }}>
				<Story />
			</div>
		),
	],
});

export const Default = meta.story();
