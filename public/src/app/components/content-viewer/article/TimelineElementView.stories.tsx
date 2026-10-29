import preview from '#.storybook/preview';
import type { TimelineElement } from '../../models/snapshotContent';
import { TimelineElementView } from './TimelineElementView';

const element: TimelineElement = {
	kind: 'timeline',
	sections: [
		{
			title: 'June 2026',
			events: [
				{
					title: 'Event',
					date: '26 June 2026',
					body: [{ kind: 'html', html: '<p>Event body.</p>' }],
				},
			],
		},
	],
};

const meta = preview.meta({
	component: TimelineElementView,
	args: { element },
});

export const Default = meta.story();
