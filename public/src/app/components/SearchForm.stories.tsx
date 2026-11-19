import preview from '#.storybook/preview';
import { SearchForm } from './SearchForm';

const meta = preview.meta({
	component: SearchForm,
});

export const Default = meta.story();
