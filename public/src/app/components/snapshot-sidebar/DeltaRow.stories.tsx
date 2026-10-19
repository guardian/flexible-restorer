import preview from '#.storybook/preview';
import { DeltaRow } from './DeltaRow';

const meta = preview.meta({
	component: DeltaRow,
	args: { label: '1 day' },
	decorators: [
		(Story) => (
			<ol style={{ listStyle: 'none', paddingLeft: 0 }}>
				<Story />
			</ol>
		),
	],
});

export const Default = meta.story();
