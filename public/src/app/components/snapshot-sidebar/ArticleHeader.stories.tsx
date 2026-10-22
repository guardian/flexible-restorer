import { mockSnapshots } from '#.storybook/mockData';
import preview from '#.storybook/preview';
import { ArticleHeader } from './ArticleHeader';

const meta = preview.meta({
	component: ArticleHeader,
	args: { activeSnapshot: mockSnapshots[0]! },
});

export const Default = meta.story();
