type FormattedCreatedDate = {
	/** e.g. "14:30:45 on 3" */
	prefix: string;
	/** Ordinal suffix rendered as a superscript, e.g. "rd". */
	ordinal: string;
	month: string;
};

const ordinalRules = new Intl.PluralRules('en', { type: 'ordinal' });
const ordinalSuffixes: Record<Intl.LDMLPluralRule, string> = {
	one: 'st',
	two: 'nd',
	few: 'rd',
	zero: 'th',
	many: 'th',
	other: 'th',
};

const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'long' });
const longDateFormatter = new Intl.DateTimeFormat('en-GB', {
	weekday: 'short',
	day: 'numeric',
	month: 'long',
	year: 'numeric',
});

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * Break the "actual" snapshot date into the parts the sidebar shows (time,
 * day-of-month with a superscript ordinal, then month) so the component can
 * render them as JSX rather than an HTML string.
 *
 * Ported from the legacy date formatting service.
 */
const formatCreatedDate = (createdDate: Date): FormattedCreatedDate => ({
	prefix: `${pad(createdDate.getHours())}:${pad(createdDate.getMinutes())}:${pad(createdDate.getSeconds())} on ${createdDate.getDate()}`,
	ordinal: ordinalSuffixes[ordinalRules.select(createdDate.getDate())],
	month: monthFormatter.format(createdDate),
});

/** e.g. "Mon 3 October 2026" (Intl adds a comma after the weekday; strip it). */
const formatLongDate = (date: Date): string =>
	longDateFormatter.format(date).replace(',', '');

/**
 * Humanised distance between `createdDate` and `from` (defaults to now), without
 * the "ago"/"in" suffix. Replicates moment's `.from(x, true)` thresholds.
 */
const relativeDate = (createdDate: Date, from: Date = new Date()): string => {
	const seconds = Math.round(
		Math.abs(from.getTime() - createdDate.getTime()) / 1000,
	);
	const minutes = Math.round(seconds / 60);
	const hours = Math.round(minutes / 60);
	const days = Math.round(hours / 24);
	const months = Math.round(days / 30);
	const years = Math.round(days / 365);

	if (seconds < 45) {
		return 'a few seconds';
	}
	if (seconds < 90) {
		return 'a minute';
	}
	if (minutes < 45) {
		return `${minutes} minutes`;
	}
	if (minutes < 90) {
		return 'an hour';
	}
	if (hours < 22) {
		return `${hours} hours`;
	}
	if (hours < 36) {
		return 'a day';
	}
	if (days < 26) {
		return `${days} days`;
	}
	if (days < 46) {
		return 'a month';
	}
	if (days < 320) {
		return `${months} months`;
	}
	if (days < 548) {
		return 'a year';
	}
	return `${years} years`;
};

export { formatCreatedDate, formatLongDate, relativeDate };
export type { FormattedCreatedDate };
