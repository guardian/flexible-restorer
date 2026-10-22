import { mockContentId } from '#.storybook/mockData';
import preview from '#.storybook/preview';
import { ContentViewer } from './ContentViewer';

const meta = preview.meta({
	component: ContentViewer,
	args: { contentId: mockContentId },
	parameters: { layout: 'fullscreen' },
});

export const Default = meta.story();
