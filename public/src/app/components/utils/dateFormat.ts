import { format, formatDistanceStrict } from 'date-fns';

type FormattedCreatedDate = {
	/** e.g. "14:30:45 on 3" */
	prefix: string;
	/** Ordinal suffix rendered as a superscript, e.g. "rd". */
	ordinal: string;
	month: string;
};

/**
 * Break the "actual" snapshot date into the parts the sidebar shows (time,
 * day-of-month with a superscript ordinal, then month) so the component can
 * render them as JSX rather than an HTML string.
 *
 * Ported from the legacy date formatting service.
 */
const formatCreatedDate = (createdDate: Date): FormattedCreatedDate => ({
	prefix: format(createdDate, "HH:mm:ss 'on' d"),
	// `do` yields e.g. "3rd"; strip the digits to leave just the ordinal suffix.
	ordinal: format(createdDate, 'do').replace(/[0-9]/g, ''),
	month: format(createdDate, 'MMMM'),
});

/** e.g. "Mon 3 October 2026". */
const formatLongDate = (date: Date): string => format(date, 'EEE d MMMM yyyy');

/**
 * Humanised distance between `createdDate` and `from` (defaults to now), without
 * the "ago"/"in" suffix (the caller appends it). A few singular/small cases are
 * remapped to the article phrasing the UI used before the date-fns switch.
 */
const relativeDate = (createdDate: Date, from: Date = new Date()): string => {
	const distance = formatDistanceStrict(createdDate, from);
	// Single-digit second gaps read as "a few seconds" (as the UI did before);
	// 10+ seconds keep the numeric form.
	if (/^\d seconds?$/.test(distance)) {
		return 'a few seconds';
	}
	if (distance === '1 minute') {
		return 'a minute';
	}
	if (distance === '1 hour') {
		return 'an hour';
	}
	return distance;
};

export { formatCreatedDate, formatLongDate, relativeDate };
export type { FormattedCreatedDate };
