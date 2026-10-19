import preview from '#.storybook/preview';
import { mockSnapshotContent } from '../storybook/mockData';
import { ContentPanels } from './ContentPanels';

const meta = preview.meta({
	component: ContentPanels,
	args: {
		elements: mockSnapshotContent.elements,
		json: mockSnapshotContent.json,
		isShowingJSON: false,
	},
	decorators: [
		// The panels track is 200% wide; clip to show one column at a time.
		(Story) => (
			<div style={{ overflow: 'hidden' }}>
				<Story />
			</div>
		),
	],
});

export const Default = meta.story();
