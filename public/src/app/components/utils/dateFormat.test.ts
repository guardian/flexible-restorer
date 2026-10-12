import { describe, expect, it } from 'vitest';
import { formatCreatedDate, formatLongDate, relativeDate } from './dateFormat';

// Build dates from local-time components (no UTC offset) so the assertions are
// stable regardless of the timezone the tests run in — the helpers format in
// local time.
const at = (
	year: number,
	monthIndex: number,
	day: number,
	hours = 12,
	minutes = 0,
	seconds = 0,
): Date => new Date(year, monthIndex, day, hours, minutes, seconds);

describe('formatCreatedDate', () => {
	it('splits the date into time, ordinal suffix and month', () => {
		expect(formatCreatedDate(at(2026, 9, 3, 14, 30, 45))).toEqual({
			prefix: '14:30:45 on 3',
			ordinal: 'rd',
			month: 'October',
		});
	});

	it('zero-pads the time components', () => {
		expect(formatCreatedDate(at(2026, 0, 1, 9, 5, 7)).prefix).toBe(
			'09:05:07 on 1',
		);
	});
});

describe('formatLongDate', () => {
	it('formats as "EEE d MMMM yyyy"', () => {
		expect(formatLongDate(at(2026, 9, 3))).toBe('Sat 3 October 2026');
	});
});

describe('relativeDate', () => {
	const base = at(2026, 9, 3, 12, 0, 0);
	const before = (ms: number): Date => new Date(base.getTime() - ms);

	it('returns the strict distance between the two dates, without a suffix', () => {
		expect(relativeDate(before(30_000), base)).toBe('30 seconds');
		expect(relativeDate(before(5 * 60_000), base)).toBe('5 minutes');
		expect(relativeDate(before(2 * 60 * 60_000), base)).toBe('2 hours');
		expect(relativeDate(before(24 * 60 * 60_000), base)).toBe('1 day');
	});
});
