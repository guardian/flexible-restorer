import preview from '#.storybook/preview';
import { RawHtml } from './RawHtml';

const meta = preview.meta({
	component: RawHtml,
	args: {
		html: '<p>This is a <strong>paragraph</strong> with a <a href="#">link</a>.</p>',
	},
});

export const Default = meta.story();
