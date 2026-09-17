import {
	viewerSlice,
	setActiveIndex,
	showHtml,
	showJson,
	openModal,
	closeModal,
	setError,
	clearError,
} from './viewerSlice';
import type { ViewerState } from './viewerSlice';

const reducer = viewerSlice.reducer;

const stateWith = (overrides: Partial<ViewerState>): ViewerState => ({
	activeIndex: 0,
	displayState: 'html',
	error: null,
	...overrides,
});

describe('viewerSlice', () => {
	it('has the expected initial state', () => {
		expect(reducer(undefined, { type: '@@INIT' })).toEqual({
			activeIndex: 0,
			displayState: 'html',
			error: null,
		});
	});

	it('sets the active index', () => {
		const next = reducer(stateWith({ activeIndex: 0 }), setActiveIndex(3));
		expect(next.activeIndex).toBe(3);
	});

	it('toggles the display state', () => {
		expect(reducer(stateWith({}), showJson()).displayState).toBe('json');
		expect(
			reducer(stateWith({ displayState: 'json' }), showHtml()).displayState,
		).toBe('html');
		expect(reducer(stateWith({}), openModal()).displayState).toBe('modal');
	});

	it('closing the modal returns to the html view', () => {
		const next = reducer(stateWith({ displayState: 'modal' }), closeModal());
		expect(next.displayState).toBe('html');
	});

	it('normalises errors to a message string', () => {
		expect(reducer(stateWith({}), setError(new Error('boom'))).error).toBe(
			'boom',
		);
		expect(reducer(stateWith({}), setError({ message: 'nope' })).error).toBe(
			'nope',
		);
		expect(reducer(stateWith({}), setError('plain')).error).toBe('plain');
	});

	it('clears the error', () => {
		const next = reducer(stateWith({ error: 'boom' }), clearError());
		expect(next.error).toBeNull();
	});
});
