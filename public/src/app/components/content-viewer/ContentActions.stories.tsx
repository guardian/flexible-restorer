import { fn } from 'storybook/test';
import preview from '#.storybook/preview';
import { mockContentId } from '../storybook/mockData';
import { ContentActions } from './ContentActions';

const meta = preview.meta({
	component: ContentActions,
	args: {
		contentId: mockContentId,
		canRestore: true,
		copyLabel: 'Copy JSON',
		toggleLabel: 'Show JSON',
		onRestore: fn(),
		onCopy: fn(),
		onToggle: fn(),
	},
});

export const Default = meta.story();
