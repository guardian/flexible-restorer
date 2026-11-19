import preview from '#.storybook/preview';
import { SplashView } from './SplashView';

const meta = preview.meta({
	component: SplashView,
	parameters: { layout: 'fullscreen' },
	decorators: [
		(Story) => (
			<div style={{ height: '100vh' }}>
				<Story />
			</div>
		),
	],
});

export const Default = meta.story();
