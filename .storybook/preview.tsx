import { configureStore, isPlain } from '@reduxjs/toolkit';
import addonDocs from '@storybook/addon-docs';
import { definePreview } from '@storybook/react-vite';
import addonMsw from 'msw-storybook-addon';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { flexibleApi } from '../public/src/app/components/store/flexibleApi';
import { restorerApi } from '../public/src/app/components/store/restorerApi';
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
		// Mirrors the app store config in store/store.ts.
		configureStore({
			reducer: {
				[restorerApi.reducerPath]: restorerApi.reducer,
				[flexibleApi.reducerPath]: flexibleApi.reducer,
				viewer: viewerSlice.reducer,
			},
			preloadedState: {
				viewer: { ...viewerSlice.getInitialState(), ...viewer },
			},
			middleware: (getDefaultMiddleware) =>
				getDefaultMiddleware({
					serializableCheck: {
						isSerializable: (value: unknown) =>
							value instanceof Date || isPlain(value),
					},
				}).concat(restorerApi.middleware, flexibleApi.middleware),
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
