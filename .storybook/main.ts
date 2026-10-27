import { defineMain } from '@storybook/react-vite/node';

export default defineMain({
	framework: '@storybook/react-vite',
	stories: [
		{
			directory: '../public/src/app/components',
			files: '**/*.stories.@(ts|tsx)',
		},
	],
	addons: ['@storybook/addon-docs', 'msw-storybook-addon'],
	// Serves the MSW service worker (mockServiceWorker.js).
	staticDirs: ['./public'],
	// The app's pre-compression plugin is only needed for Play-served assets.
	viteFinal: (config) => ({
		...config,
		plugins: (config.plugins ?? [])
			.flat()
			.filter(
				(plugin) =>
					!(
						plugin &&
						'name' in plugin &&
						plugin.name.includes('compression')
					),
			),
	}),
});
