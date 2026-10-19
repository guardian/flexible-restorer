import preview from '#.storybook/preview';
import { NotFoundView } from './NotFoundView';

const meta = preview.meta({
	component: NotFoundView,
});

export const Default = meta.story();
