import preview from '#.storybook/preview';
import type { ArticleElement } from '../../models/snapshotContent';
import { ArticleElementView } from './ArticleElementView';

const element: ArticleElement = {
	kind: 'html',
	html: '<p>This is a <strong>paragraph</strong> of article body text.</p>',
};

const meta = preview.meta({
	component: ArticleElementView,
	args: { element },
});

export const Default = meta.story();
