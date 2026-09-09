import type { RawSnapshot } from '../models/snapshotContent';

// Fetch layer for a single snapshot's content, mirroring the legacy
// `SnapshotService.getSnapshot` / `SnapshotModels` used by `SnapshotContentCtrl`.
const snapshotUrl = (
	systemId: string,
	contentId: string,
	timestamp: string,
): string => `/api/1/version/${systemId}/${contentId}/${timestamp}`;

type SnapshotRef = {
	systemId: string;
	contentId: string;
	timestamp: string;
};

/**
 * Fetch the raw snapshot for a given system/content/timestamp. A failed request
 * throws so the caller can surface the Angular error modal. Parsing into a view
 * model is left to `parseSnapshotContent`.
 */
const fetchSnapshot = async ({
	systemId,
	contentId,
	timestamp,
}: SnapshotRef): Promise<RawSnapshot> => {
	const response = await fetch(snapshotUrl(systemId, contentId, timestamp), {
		headers: { Accept: 'application/json' },
		credentials: 'same-origin',
	});

	if (!response.ok) {
		throw new Error(`Failed to load snapshot (${response.status})`);
	}

	return (await response.json()) as RawSnapshot;
};

export { fetchSnapshot, snapshotUrl };
export type { SnapshotRef };
