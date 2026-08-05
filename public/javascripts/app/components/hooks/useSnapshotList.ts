import useSWR from 'swr';
import type { SnapshotIdViewModel, RawSnapshotId } from '../models/snapshotId';
import { parseSnapshotList } from '../models/snapshotId';

/**
 * Fetch and parse the version list for a piece of content. Mirrors the error
 * behaviour of the legacy `SnapshotIdModels.getCollection`: an empty/non-array
 * payload is treated as "no snapshots available".
 */
const fetcher = async (url: string): Promise<SnapshotIdViewModel[]> => {
	const response = await fetch(url, {
		headers: { Accept: 'application/json' },
		credentials: 'same-origin',
	});

	if (!response.ok) {
		throw new Error(`Failed to load snapshots (${response.status})`);
	}

	const data: unknown = await response.json();
	if (!Array.isArray(data) || data.length === 0) {
		throw new Error(
			'There are no snapshots available for this piece of content',
		);
	}

	return parseSnapshotList(data as RawSnapshotId[]);
};

type UseSnapshotList = {
	snapshots: SnapshotIdViewModel[] | undefined;
	isLoading: boolean;
	error: Error | undefined;
};

/**
 * SWR-backed hook exposing the sorted snapshot list for `contentId`. SWR handles
 * caching/deduplication, replacing the module-level cache the Angular collection
 * used.
 */
const useSnapshotList = (contentId: string): UseSnapshotList => {
	const { data, error, isLoading } = useSWR<SnapshotIdViewModel[], Error>(
		`/api/1/versionList/${contentId}`,
		fetcher,
		{ revalidateOnFocus: false },
	);

	return { snapshots: data, isLoading, error };
};

export { useSnapshotList };
export type { UseSnapshotList };
