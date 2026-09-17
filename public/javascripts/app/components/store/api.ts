import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { fetchSnapshotList } from '../api/fetchSnapshotList';
import { parseSnapshotList } from '../models/snapshotId';
import type { SnapshotIdViewModel } from '../models/snapshotId';
import { fetchSnapshot } from '../api/fetchSnapshot';
import type { SnapshotRef } from '../api/fetchSnapshot';
import type { RawSnapshot } from '../models/snapshotContent';
import { fetchUser } from '../api/fetchUser';
import type { User } from '../api/fetchUser';
import { fetchRestoreDestinations } from '../api/fetchRestoreDestinations';
import type { RestoreDestination } from '../api/fetchRestoreDestinations';
import { restoreContent } from '../api/restoreContent';

// A serialisable error shape kept in the RTK Query cache. The underlying fetch
// helpers throw `Error`s; we retain only the message so Redux state stays
// serialisable while the error modal can still show it (see viewerSlice).
type ApiError = { message: string };

const toApiError = (error: unknown): ApiError => ({
	message:
		error instanceof Error
			? error.message
			: typeof error === 'string'
				? error
				: String(error),
});

type RestoreParams = {
	sourceSystemId: string;
	contentId: string;
	sourceTimestamp: string;
	destinationSystemId: string;
};

/**
 * RTK Query API for the restorer frontend. Each endpoint wraps the existing
 * `fetch*` helper via `queryFn`, so the request options, endpoint URLs, "no
 * snapshots/destinations" contracts and the `fetchUser` memoisation are all
 * preserved unchanged — RTK Query adds caching, deduplication and hook state on
 * top. Replaces the previous SWR usage.
 *
 * The version list is parsed into its view model on ingress (in the endpoint);
 * this puts `moment` values in the cache, which the store's serializableCheck is
 * configured to allow (see store.ts). Other endpoints return raw responses.
 */
const api = createApi({
	reducerPath: 'api',
	baseQuery: fakeBaseQuery<ApiError>(),
	endpoints: (builder) => ({
		getSnapshotList: builder.query<SnapshotIdViewModel[], string>({
			queryFn: async (contentId) => {
				try {
					const raw = await fetchSnapshotList(contentId);
					return { data: parseSnapshotList(raw) };
				} catch (error) {
					return { error: toApiError(error) };
				}
			},
		}),
		getSnapshot: builder.query<RawSnapshot, SnapshotRef>({
			queryFn: async (ref) => {
				try {
					return { data: await fetchSnapshot(ref) };
				} catch (error) {
					return { error: toApiError(error) };
				}
			},
		}),
		getUser: builder.query<User, void>({
			queryFn: async () => {
				try {
					return { data: await fetchUser() };
				} catch (error) {
					return { error: toApiError(error) };
				}
			},
		}),
		getRestoreDestinations: builder.query<RestoreDestination[], string>({
			// Drop the cache as soon as the modal closes (no subscribers) so each
			// reopen fetches fresh destinations, matching the legacy per-open fetch.
			keepUnusedDataFor: 0,
			queryFn: async (contentId) => {
				try {
					return { data: await fetchRestoreDestinations(contentId) };
				} catch (error) {
					return { error: toApiError(error) };
				}
			},
		}),
		restoreContent: builder.mutation<void, RestoreParams>({
			queryFn: async (params) => {
				try {
					await restoreContent(params);
					return { data: undefined };
				} catch (error) {
					return { error: toApiError(error) };
				}
			},
		}),
	}),
});

const {
	useGetSnapshotListQuery,
	useGetSnapshotQuery,
	useGetUserQuery,
	useGetRestoreDestinationsQuery,
	useRestoreContentMutation,
} = api;

export {
	api,
	useGetSnapshotListQuery,
	useGetSnapshotQuery,
	useGetUserQuery,
	useGetRestoreDestinationsQuery,
	useRestoreContentMutation,
};
export type { ApiError, RestoreParams };
