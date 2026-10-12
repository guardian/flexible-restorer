import moment from 'moment';

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
const formatCreatedDate = (createdDate: number): FormattedCreatedDate => {
	const value = moment(createdDate);
	return {
		prefix: value.format('HH:mm:ss [on] D'),
		ordinal: value.format('Do').slice(-2),
		month: value.format('MMMM'),
	};
};

/**
 * Humanised distance between `createdDate` and `from` (defaults to now), without
 * the "ago"/"in" suffix from the legacy snapshot model.
 */
const relativeDate = (createdDate: number, from: number = Date.now()): string =>
	moment(createdDate).from(moment(from), true);

export { formatCreatedDate, relativeDate };
export type { FormattedCreatedDate };
