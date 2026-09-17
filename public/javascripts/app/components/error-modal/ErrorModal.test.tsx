import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import { api } from '../store/api';
import { viewerSlice, setError } from '../store/viewerSlice';
import { ErrorModal } from './ErrorModal';

const makeStore = () =>
	configureStore({
		reducer: {
			[api.reducerPath]: api.reducer,
			viewer: viewerSlice.reducer,
		},
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware().concat(api.middleware),
	});

describe('ErrorModal', () => {
	it('is hidden when there is no error', () => {
		const store = makeStore();
		render(
			<Provider store={store}>
				<ErrorModal />
			</Provider>,
		);
		expect(screen.queryByText('Ooops, something went wrong')).toBeNull();
	});

	it('shows the error message from the viewer slice', () => {
		const store = makeStore();
		store.dispatch(setError(new Error('Everything is broken')));

		render(
			<Provider store={store}>
				<ErrorModal />
			</Provider>,
		);

		expect(
			screen.getByText('Ooops, something went wrong'),
		).toBeInTheDocument();
		expect(screen.getByText('Everything is broken')).toBeInTheDocument();
	});
});
