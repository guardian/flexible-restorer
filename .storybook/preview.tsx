import addonDocs from '@storybook/addon-docs';
import { definePreview } from '@storybook/react-vite';
import addonMsw from 'msw-storybook-addon';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '../public/src/app/components/store/store';
import { viewerSlice } from '../public/src/app/components/store/viewerSlice';
import type { ViewerState } from '../public/src/app/components/store/viewerSlice';
import { handlers } from '../public/src/app/components/storybook/handlers';
import '../public/src/app/fonts.css';
import '../public/gu-noting.css';

/** A fresh store per story so viewer state and RTK Query cache never leak between stories. */
const StoreProvider = ({
	viewer,
	children,
}: {
	viewer: Partial<ViewerState> | undefined;
	children: ReactNode;
}) => {
	const [store] = useState(() =>
		makeStore({
			viewer: { ...viewerSlice.getInitialState(), ...viewer },
		}),
	);
	return <Provider store={store}>{children}</Provider>;
};

export default definePreview({
	addons: [addonDocs(), addonMsw()],
	tags: ['autodocs'],
	beforeEach({ msw }) {
		msw.use(...Object.values(handlers));
	},
	decorators: [
		(Story, { parameters }) => (
			<StoreProvider
				viewer={parameters.viewer as Partial<ViewerState> | undefined}
			>
				<Story />
			</StoreProvider>
		),
	],
});
