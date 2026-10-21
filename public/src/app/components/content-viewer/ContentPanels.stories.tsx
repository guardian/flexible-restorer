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
		// Clip the 200%-wide track to one column, and bound the height as the app layout does so the panels scroll.
		(Story) => (
			<div style={{ display: 'flex', height: 600, overflow: 'hidden' }}>
				<Story />
			</div>
		),
	],
});

export const Default = meta.story();
