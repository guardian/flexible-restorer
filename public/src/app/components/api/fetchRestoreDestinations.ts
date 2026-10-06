// Restore-destination fetch layer for the React restore modal. Mirrors the
// The restore destinations request: a failed request throws and
// an empty payload is treated as "no destinations available".
import moment from 'moment';
import { formatCreatedDate } from '../utils/dateFormat';
import type { FormattedCreatedDate } from '../utils/dateFormat';

/** Change summary for a destination that already holds content. */
type DestinationChangeDetails = {
	revisionId: number;
	lastModified: number | string;
};

/**
 * A single restore destination as returned by
 * `GET /api/1/restore/destinations/:contentId` (see app/controllers/Restore.scala).
 */
type RestoreDestination = {
	systemId: string;
	displayName: string;
	available: boolean;
	composerPrefix: string;
	changeDetails?: DestinationChangeDetails | null;
};

/** Per-destination change summary, ported from `RestoreFormCtrl`'s `changeString`. */
type DestinationChange =
	| { kind: 'revision'; revisionId: number; date: FormattedCreatedDate }
	| { kind: 'not-on-instance' }
	| { kind: 'none' };

/** A restore destination prepared for rendering as a radio option. */
type RestoreDestinationView = {
	systemId: string;
	displayName: string;
	available: boolean;
	composerPrefix: string;
	change: DestinationChange;
};

/** Prepare a raw destination for rendering (ported from `RestoreFormCtrl`). */
const toDestinationView = (
	destination: RestoreDestination,
): RestoreDestinationView => {
	const { systemId, displayName, available, composerPrefix, changeDetails } =
		destination;

	let change: DestinationChange;
	if (changeDetails) {
		change = {
			kind: 'revision',
			revisionId: changeDetails.revisionId,
			date: formatCreatedDate(moment(changeDetails.lastModified)),
		};
	} else if (available) {
		change = { kind: 'not-on-instance' };
	} else {
		change = { kind: 'none' };
	}

	return { systemId, displayName, available, composerPrefix, change };
};

/** Parse the raw destinations into render-ready view models. */
const parseRestoreDestinations = (
	destinations: RestoreDestination[],
): RestoreDestinationView[] => destinations.map(toDestinationView);

const NO_DESTINATIONS_MESSAGE = 'There are no destinations available';

const destinationsUrl = (contentId: string): string =>
	`/api/1/restore/destinations/${contentId}`;

/**
 * Fetch the restore destinations for a piece of content. Throws on a failed
 * request or an empty/non-array payload, matching the legacy service contract.
 */
const fetchRestoreDestinations = async (
	contentId: string,
): Promise<RestoreDestination[]> => {
	const response = await fetch(destinationsUrl(contentId), {
		headers: { Accept: 'application/json' },
		credentials: 'same-origin',
	});

	if (!response.ok) {
		throw new Error(`Failed to load destinations (${response.status})`);
	}

	const data: unknown = await response.json();
	if (!Array.isArray(data) || data.length === 0) {
		throw new Error(NO_DESTINATIONS_MESSAGE);
	}

	return data as RestoreDestination[];
};

export {
	fetchRestoreDestinations,
	destinationsUrl,
	parseRestoreDestinations,
	NO_DESTINATIONS_MESSAGE,
};
export type {
	RestoreDestination,
	DestinationChangeDetails,
	DestinationChange,
	RestoreDestinationView,
};
