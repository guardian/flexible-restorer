// Restore-destination fetch layer for the React restore modal. Mirrors the
// legacy AngularJS `RestoreService.getDestinations`: a failed request throws and
// an empty payload is treated as "no destinations available".

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

export { fetchRestoreDestinations, destinationsUrl, NO_DESTINATIONS_MESSAGE };
export type { RestoreDestination, DestinationChangeDetails };
