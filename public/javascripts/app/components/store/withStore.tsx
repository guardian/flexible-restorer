import type { ComponentType, FunctionComponent } from 'react';
import { createElement } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';

/**
 * Wrap a component in the shared Redux `<Provider>`. Applied at
 * react2angular registration (see ../index.js) so every bridged React root
 * connects to the same singleton store.
 */
const withStore = <P extends object>(
	Component: ComponentType<P>,
): FunctionComponent<P> => {
	const Wrapped: FunctionComponent<P> = (props) => (
		<Provider store={store}>{createElement(Component, props)}</Provider>
	);
	Wrapped.displayName = `withStore(${Component.displayName ?? Component.name ?? 'Component'})`;
	return Wrapped;
};

export { withStore };
