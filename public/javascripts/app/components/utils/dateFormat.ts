import moment from 'moment';

/**
 * Render the "actual" snapshot date as the small chunk of HTML the sidebar shows
 * (time, day-of-month with a superscript ordinal, then month).
 *
 * Ported verbatim from the AngularJS `DateFormatService.formatHtml` so the
 * migrated React list matches the legacy markup exactly.
 */
const formatCreatedDateHtml = (createdDate: moment.Moment): string => {
	const ordinal = createdDate.format('Do').slice(-2);
	const prefix = createdDate.format('HH:mm:ss [on] D');
	const month = createdDate.format('MMMM');
	return `${prefix}<sup>${ordinal}</sup> ${month}`;
};

/**
 * Humanised distance between `createdDate` and `from` (defaults to now), without
 * the "ago"/"in" suffix — mirrors the AngularJS `SnapshotIdModel.getRelativeDate`.
 */
const relativeDate = (
	createdDate: moment.Moment,
	from: moment.Moment = moment(),
): string => createdDate.from(from, true);

export { formatCreatedDateHtml, relativeDate };
