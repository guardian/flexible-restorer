import moment from 'moment';
import { formatCreatedDateHtml, relativeDate } from '../utils/dateFormat';

// Raw shape of a single entry returned by `GET /api/1/versionList/:contentId`
// (see app/controllers/Versions.scala). Only the fields the sidebar reads are
// modelled; everything is optional except the identifier/system the server
// always sends, matching the defensive `lodash.get` access of the legacy
// `SnapshotIdModel`.
type RawUser = {
	firstName?: string;
	lastName?: string;
};

type RawContentChangeDetails = {
	revision?: number;
	published?: unknown;
	lastModified?: { user?: RawUser };
};

type RawSettings = {
	legallySensitive?: string;
	commentable?: string;
	embargoedUntil?: string;
};

type RawSummary = {
	preview?: {
		fields?: { headline?: string };
		settings?: RawSettings;
	};
	published?: boolean;
	scheduledLaunchDate?: string;
	contentChangeDetails?: RawContentChangeDetails;
};

type RawSystem = {
	id: string;
	isSecondary: boolean;
	composerPrefix: string;
};

type RawSnapshotId = {
	contentId: string;
	timestamp: string;
	system: RawSystem;
	info?: {
		metadata?: { reason?: string };
		summary?: RawSummary;
	};
};

/** Comment settings, mirroring `SnapshotIdModel.commentsEnabled`. */
type CommentsState = {
	defined: string | undefined;
	on: boolean;
};

/**
 * View model consumed by the React sidebar. All fields are pre-derived (the
 * legacy Angular model computed these lazily via getters) so components stay
 * presentational.
 */
type SnapshotIdViewModel = {
	contentId: string;
	timestamp: string;
	systemId: string;
	isSecondary: boolean;
	createdDate: moment.Moment;
	revisionId: number | undefined;
	headline: string | undefined;
	composerUrl: string;
	createdDateHtml: string;
	snapshotReason: string | undefined;
	becauseOfLaunch: boolean;
	legallySensitive: boolean;
	comments: CommentsState;
	publishedState: string;
	userEmail: string;
};

/** Ported from `SnapshotIdModel.isBecauseOfLaunch`. */
const isBecauseOfLaunch = (reason: string | undefined): boolean => {
	const value = reason ?? '';
	return value === 'Published' || value.toLowerCase().includes('launch');
};

/** Ported from `SnapshotIdModel.getPublishedState`. */
const derivePublishedState = (summary: RawSummary | undefined): string => {
	const settings = summary?.preview?.settings;
	const scheduledLaunchDate = summary?.scheduledLaunchDate;
	const published = summary?.published;
	const publishedDetails = summary?.contentChangeDetails?.published;

	if (scheduledLaunchDate) {
		return `Scheduled  ${moment(scheduledLaunchDate).format('ddd D MMMM YYYY')}`;
	}

	if (settings?.embargoedUntil) {
		return `Embargoed until ${moment(settings.embargoedUntil).format('ddd D MMMM YYYY')}`;
	}

	if (published) {
		return 'Published';
	}

	if (!published && publishedDetails) {
		return 'Taken down';
	}

	return '';
};

/** Ported from `SnapshotIdModel.getUserEmail` (returns a display name, despite the name). */
const deriveUserEmail = (summary: RawSummary | undefined): string => {
	const user = summary?.contentChangeDetails?.lastModified?.user;
	if (user) {
		return `${user.firstName} ${user.lastName}`;
	}
	return '-';
};

/**
 * Map a raw version-list entry onto the sidebar view model, reproducing the
 * derivations from the AngularJS `SnapshotIdModel`.
 */
const toViewModel = (raw: RawSnapshotId): SnapshotIdViewModel => {
	const summary = raw.info?.summary;
	const settings = summary?.preview?.settings;
	// Timestamps come back with `_` separating the time components; moment needs `:`.
	const createdDate = moment(raw.timestamp.replace(/_/g, ':'));
	const commentable = settings?.commentable;
	const snapshotReason = raw.info?.metadata?.reason;

	return {
		contentId: raw.contentId,
		timestamp: raw.timestamp,
		systemId: raw.system.id,
		isSecondary: raw.system.isSecondary,
		createdDate,
		revisionId: summary?.contentChangeDetails?.revision,
		headline: summary?.preview?.fields?.headline,
		composerUrl: `${raw.system.composerPrefix}/content/${raw.contentId}`,
		createdDateHtml: formatCreatedDateHtml(createdDate),
		snapshotReason,
		becauseOfLaunch: isBecauseOfLaunch(snapshotReason),
		legallySensitive: settings?.legallySensitive === 'true',
		comments: {
			defined: commentable,
			on: commentable === 'true',
		},
		publishedState: derivePublishedState(summary),
		userEmail: deriveUserEmail(summary),
	};
};

/**
 * Parse the raw version-list payload into sorted view models. Sorted newest
 * first, matching the `SnapshotIds` collection comparator.
 */
const parseSnapshotList = (raw: RawSnapshotId[]): SnapshotIdViewModel[] =>
	raw
		.map(toViewModel)
		.sort((a, b) => (a.createdDate.isBefore(b.createdDate) ? 1 : -1));

/** Humanised gap between a snapshot and the next (older) one — powers the delta rows. */
const deltaFrom = (
	snapshot: SnapshotIdViewModel,
	next: SnapshotIdViewModel | undefined,
): string => relativeDate(snapshot.createdDate, next?.createdDate);

export { parseSnapshotList, deltaFrom };
export type { RawSnapshotId, SnapshotIdViewModel, CommentsState };
