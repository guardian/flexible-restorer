import useSWR from 'swr';
import type { SnapshotIdViewModel } from '../models/snapshotId';
import { parseSnapshotList } from '../models/snapshotId';
import { fetchSnapshotList, versionListUrl } from '../api/fetchSnapshotList';

/**
 * Fetch (via the shared `fetchSnapshotList`) and parse the version list for a
 * piece of content into the sidebar view models.
 */
const fetcher = (contentId: string): Promise<SnapshotIdViewModel[]> =>
	fetchSnapshotList(contentId).then(parseSnapshotList);

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
		versionListUrl(contentId),
		() => fetcher(contentId),
		{ revalidateOnFocus: false },
	);

	return { snapshots: data, isLoading, error };
};

export { useSnapshotList };
export type { UseSnapshotList };
