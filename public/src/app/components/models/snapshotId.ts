import { formatLongDate, relativeDate } from '../utils/dateFormat';

// Raw shape of a single entry returned by `GET /api/1/versionList/:contentId`
// (see app/controllers/Versions.scala). Only the fields the sidebar reads are
// modelled; the identifier, timestamp and system fields are required.
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

/** Raw comment setting and its boolean interpretation. */
type CommentsState = {
	defined: string | undefined;
	on: boolean;
};

/**
 * View model with pre-derived fields so sidebar components stay presentational.
 */
type SnapshotIdViewModel = {
	contentId: string;
	timestamp: string;
	systemId: string;
	isSecondary: boolean;
	createdDate: Date;
	revisionId: number | undefined;
	headline: string | undefined;
	composerUrl: string;
	snapshotReason: string | undefined;
	becauseOfLaunch: boolean;
	legallySensitive: boolean;
	comments: CommentsState;
	publishedState: string;
	userEmail: string;
};

const isBecauseOfLaunch = (reason: string | undefined): boolean => {
	const value = reason ?? '';
	return value === 'Published' || value.toLowerCase().includes('launch');
};

const derivePublishedState = (summary: RawSummary | undefined): string => {
	const settings = summary?.preview?.settings;
	const scheduledLaunchDate = summary?.scheduledLaunchDate;
	const published = summary?.published;
	const publishedDetails = summary?.contentChangeDetails?.published;

	if (scheduledLaunchDate) {
		return `Scheduled  ${formatLongDate(new Date(scheduledLaunchDate))}`;
	}

	if (settings?.embargoedUntil) {
		return `Embargoed until ${formatLongDate(new Date(settings.embargoedUntil))}`;
	}

	if (published) {
		return 'Published';
	}

	if (publishedDetails) {
		return 'Taken down';
	}

	return '';
};

/** Returns a display name, despite the function's name. */
const deriveUserEmail = (summary: RawSummary | undefined): string => {
	const user = summary?.contentChangeDetails?.lastModified?.user;
	if (user) {
		return `${user.firstName} ${user.lastName}`;
	}
	return '-';
};

/**
 * Map a raw version-list entry onto the sidebar view model.
 */
const toViewModel = (raw: RawSnapshotId): SnapshotIdViewModel => {
	const summary = raw.info?.summary;
	const settings = summary?.preview?.settings;
	const createdDate = new Date(raw.timestamp.replace(/_/g, ':'));
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
 * Parse the raw version-list payload into view models sorted newest first.
 */
const parseSnapshotList = (raw: RawSnapshotId[]): SnapshotIdViewModel[] =>
	raw
		.map(toViewModel)
		.sort((a, b) => (a.createdDate < b.createdDate ? 1 : -1));

/** Humanised gap between a snapshot and the next (older) one — powers the delta rows. */
const deltaFrom = (
	snapshot: SnapshotIdViewModel,
	next: SnapshotIdViewModel | undefined,
): string => relativeDate(snapshot.createdDate, next?.createdDate);

export { parseSnapshotList, deltaFrom };
export type { RawSnapshotId, SnapshotIdViewModel, CommentsState };
