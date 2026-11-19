import { mockSnapshotContent } from '#.storybook/mockData';
import preview from '#.storybook/preview';
import { ContentFurniture } from './ContentFurniture';

const meta = preview.meta({
	component: ContentFurniture,
	args: {
		headline: mockSnapshotContent.headline,
		standfirst: mockSnapshotContent.standfirst,
		trailText: mockSnapshotContent.trailText,
	},
});

export const Default = meta.story();
