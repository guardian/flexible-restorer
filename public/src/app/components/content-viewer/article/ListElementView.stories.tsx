import preview from '#.storybook/preview';
import type { ListElement } from '../../models/snapshotContent';
import { ListElementView } from './ListElementView';

const element: ListElement = {
	kind: 'list',
	items: [
		{
			title: 'Jane Smith',
			byline: 'Editor',
			bio: '<p>Jane has worked at the paper for <em>ten</em> years.</p>',
			endNote: 'Interview edited for length.',
			content: [{ kind: 'html', html: '<p>List item content.</p>' }],
		},
	],
};

const meta = preview.meta({
	component: ListElementView,
	args: { element },
});

export const Default = meta.story();
