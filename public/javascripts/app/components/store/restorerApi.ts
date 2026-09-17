import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { fetchSnapshotList } from '../api/fetchSnapshotList';
import { parseSnapshotList } from '../models/snapshotId';
import type { SnapshotIdViewModel } from '../models/snapshotId';
import { fetchSnapshot } from '../api/fetchSnapshot';
import type { SnapshotRef } from '../api/fetchSnapshot';
import { parseSnapshotContent } from '../models/snapshotContent';
import type { SnapshotContent } from '../models/snapshotContent';
import { fetchUser } from '../api/fetchUser';
import type { User } from '../api/fetchUser';
import { toApiError } from './apiError';
import type { ApiError } from './apiError';

/**
 * RTK Query API for the restorer app's own backend: the snapshot version store
 * (`controllers.Versions` → `SnapshotApi`) and the current user
 * (`controllers.Login`).
 *
 * Each endpoint wraps the existing `fetch*` helper via `queryFn`, preserving its
 * request options, URL and error contract; responses are parsed into their view
 * models on ingress so every consumer shares one parsed reference. The parsed
 * models hold `moment` values, which the store's serializableCheck allows (see
 * store.ts).
 */
const restorerApi = createApi({
	reducerPath: 'restorerApi',
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
		getSnapshot: builder.query<SnapshotContent, SnapshotRef>({
			queryFn: async (ref) => {
				try {
					const raw = await fetchSnapshot(ref);
					return { data: parseSnapshotContent(raw) };
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
	}),
});

const {
	useGetSnapshotListQuery,
	useGetSnapshotQuery,
	useGetUserQuery,
} = restorerApi;

export {
	restorerApi,
	useGetSnapshotListQuery,
	useGetSnapshotQuery,
	useGetUserQuery,
};
