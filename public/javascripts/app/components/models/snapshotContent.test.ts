import { parseSnapshotContent } from './snapshotContent';
import type { RawSnapshot } from './snapshotContent';

describe('parseSnapshotContent', () => {
	it('extracts furniture and pretty-printed JSON', () => {
		const raw: RawSnapshot = {
			preview: {
				fields: {
					headline: 'A headline',
					standfirst: 'A standfirst',
					trailText: 'Some trail text',
				},
				blocks: [],
			},
		};

		const content = parseSnapshotContent(raw);

		expect(content.headline).toBe('A headline');
		expect(content.standfirst).toBe('A standfirst');
		expect(content.trailText).toBe('Some trail text');
		expect(content.json).toBe(JSON.stringify(raw, null, 2));
	});

	it('flattens block elements and maps text/html leaves to html elements', () => {
		const raw: RawSnapshot = {
			preview: {
				blocks: [
					{ elements: [{ fields: { text: '<p>One</p>' } }] },
					{ elements: [{ fields: { html: '<p>Two</p>' } }] },
				],
			},
		};

		const content = parseSnapshotContent(raw);

		expect(content.elements).toEqual([
			{ kind: 'html', html: '<p>One</p>' },
			{ kind: 'html', html: '<p>Two</p>' },
		]);
	});

	it('maps a list element with nested content', () => {
		const raw: RawSnapshot = {
			preview: {
				blocks: [
					{
						elements: [
							{
								fields: {
									items: [
										{
											title: 'Item title',
											byline: 'By someone',
											bio: '<p>bio</p>',
											endNote: 'the end',
											content: [{ fields: { text: '<p>body</p>' } }],
										},
									],
								},
							},
						],
					},
				],
			},
		};

		const content = parseSnapshotContent(raw);

		expect(content.elements).toEqual([
			{
				kind: 'list',
				items: [
					{
						title: 'Item title',
						byline: 'By someone',
						bio: '<p>bio</p>',
						endNote: 'the end',
						content: [{ kind: 'html', html: '<p>body</p>' }],
					},
				],
			},
		]);
	});

	it('maps a timeline element with nested event bodies', () => {
		const raw: RawSnapshot = {
			preview: {
				blocks: [
					{
						elements: [
							{
								fields: {
									sections: [
										{
											title: 'Section',
											events: [
												{
													title: 'Event',
													date: '2020',
													body: [{ fields: { html: '<p>event body</p>' } }],
												},
											],
										},
									],
								},
							},
						],
					},
				],
			},
		};

		const content = parseSnapshotContent(raw);

		expect(content.elements).toEqual([
			{
				kind: 'timeline',
				sections: [
					{
						title: 'Section',
						events: [
							{
								title: 'Event',
								date: '2020',
								body: [{ kind: 'html', html: '<p>event body</p>' }],
							},
						],
					},
				],
			},
		]);
	});

	it('ignores elements with no recognised fields', () => {
		const raw: RawSnapshot = {
			preview: {
				blocks: [{ elements: [{ fields: {} }, { fields: { text: 'ok' } }] }],
			},
		};

		const content = parseSnapshotContent(raw);

		expect(content.elements).toEqual([{ kind: 'html', html: 'ok' }]);
	});
});
