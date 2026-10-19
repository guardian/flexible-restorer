import preview from '#.storybook/preview';
import { mockContentId } from '../storybook/mockData';
import { ContentViewer } from './ContentViewer';

const meta = preview.meta({
	component: ContentViewer,
	args: { contentId: mockContentId },
	parameters: { layout: 'fullscreen' },
});

export const Default = meta.story();
