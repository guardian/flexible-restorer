import type { RawSnapshotId } from '../models/snapshotId';

// Shared fetch layer for the version list, used by both the React sidebar
// (`useSnapshotList`) and the legacy AngularJS `SnapshotIdModels` collection so
// the endpoint, request options and "no snapshots" contract can't drift apiece.
const NO_SNAPSHOTS_MESSAGE =
	'There are no snapshots available for this piece of content';

const versionListUrl = (contentId: string): string =>
	`/api/1/versionList/${contentId}`;

/**
 * Fetch the raw version list for a piece of content. A failed request throws,
 * and an empty/non-array payload is treated as "no snapshots available"
 * (mirroring the legacy `SnapshotIdModels.getCollection`). Parsing into a
 * concrete model is left to each caller.
 */
const fetchSnapshotList = async (
	contentId: string,
): Promise<RawSnapshotId[]> => {
	const response = await fetch(versionListUrl(contentId), {
		headers: { Accept: 'application/json' },
		credentials: 'same-origin',
	});

	if (!response.ok) {
		throw new Error(`Failed to load snapshots (${response.status})`);
	}

	const data: unknown = await response.json();
	if (!Array.isArray(data) || data.length === 0) {
		throw new Error(NO_SNAPSHOTS_MESSAGE);
	}

	return data as RawSnapshotId[];
};

export { fetchSnapshotList, versionListUrl, NO_SNAPSHOTS_MESSAGE };
