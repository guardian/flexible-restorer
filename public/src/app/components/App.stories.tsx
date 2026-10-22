import { useEffect, useState } from 'react';
import { mockContentId } from '#.storybook/mockData';
import preview from '#.storybook/preview';
import { App } from './App';

const meta = preview.meta({
	component: App,
	parameters: { layout: 'fullscreen' },
	decorators: [
		// App routes on window.location, so point the iframe at a versions page
		// for the story and restore the Storybook URL on unmount.
		(Story) => {
			const [originalUrl] = useState(() => {
				const url = window.location.href;
				window.history.replaceState(
					{},
					'',
					`/content/${mockContentId}/versions`,
				);
				return url;
			});
			useEffect(
				() => () => window.history.replaceState({}, '', originalUrl),
				[originalUrl],
			);
			return <Story />;
		},
	],
});

export const Default = meta.story();
