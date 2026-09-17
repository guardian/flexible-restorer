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
	contentView: 'html',
	isModalOpen: false,
	error: null,
	...overrides,
});

describe('viewerSlice', () => {
	it('has the expected initial state', () => {
		expect(reducer(undefined, { type: '@@INIT' })).toEqual({
			activeIndex: 0,
			contentView: 'html',
			isModalOpen: false,
			error: null,
		});
	});

	it('sets the active index', () => {
		const next = reducer(stateWith({ activeIndex: 0 }), setActiveIndex(3));
		expect(next.activeIndex).toBe(3);
	});

	it('toggles the content view', () => {
		expect(reducer(stateWith({}), showJson()).contentView).toBe('json');
		expect(
			reducer(stateWith({ contentView: 'json' }), showHtml()).contentView,
		).toBe('html');
	});

	it('opens the modal without touching the content view', () => {
		const next = reducer(stateWith({ contentView: 'json' }), openModal());
		expect(next.isModalOpen).toBe(true);
		expect(next.contentView).toBe('json');
	});

	it('closing the modal clears it and returns to the html view', () => {
		const next = reducer(
			stateWith({ isModalOpen: true, contentView: 'json' }),
			closeModal(),
		);
		expect(next.isModalOpen).toBe(false);
		expect(next.contentView).toBe('html');
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
