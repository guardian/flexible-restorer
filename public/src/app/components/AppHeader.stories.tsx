import preview from '#.storybook/preview';
import { AppHeader } from './AppHeader';

const meta = preview.meta({
	component: AppHeader,
});

export const Default = meta.story();
