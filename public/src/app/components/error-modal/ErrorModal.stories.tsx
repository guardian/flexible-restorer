import preview from '#.storybook/preview';
import { ErrorModal } from './ErrorModal';

const meta = preview.meta({
	component: ErrorModal,
	parameters: {
		viewer: {
			error: 'There are no snapshots available for this piece of content',
		},
	},
});

export const Default = meta.story();
