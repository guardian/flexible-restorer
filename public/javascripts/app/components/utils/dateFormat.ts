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
 * Ported from the AngularJS `DateFormatService.formatHtml`.
 */
const formatCreatedDate = (createdDate: moment.Moment): FormattedCreatedDate => ({
	prefix: createdDate.format('HH:mm:ss [on] D'),
	ordinal: createdDate.format('Do').slice(-2),
	month: createdDate.format('MMMM'),
});

/**
 * Humanised distance between `createdDate` and `from` (defaults to now), without
 * the "ago"/"in" suffix — mirrors the AngularJS `SnapshotIdModel.getRelativeDate`.
 */
const relativeDate = (
	createdDate: moment.Moment,
	from: moment.Moment = moment(),
): string => createdDate.from(from, true);

export { formatCreatedDate, relativeDate };
export type { FormattedCreatedDate };
