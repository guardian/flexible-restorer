import preview from '#.storybook/preview';
import { mockSnapshotContent } from '../../storybook/mockData';
import { ArticleBody } from './ArticleBody';

const meta = preview.meta({
	component: ArticleBody,
	args: { elements: mockSnapshotContent.elements },
});

export const Default = meta.story();
