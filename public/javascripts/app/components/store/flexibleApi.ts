import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import {
	fetchRestoreDestinations,
	parseRestoreDestinations,
} from '../api/fetchRestoreDestinations';
import type { RestoreDestinationView } from '../api/fetchRestoreDestinations';
import { restoreContent } from '../api/restoreContent';
import { toApiError } from './apiError';
import type { ApiError } from './apiError';

type RestoreParams = {
	sourceSystemId: string;
	contentId: string;
	sourceTimestamp: string;
	destinationSystemId: string;
};

/**
 * RTK Query API for Flexible Content operations, proxied through the restorer's
 * `controllers.Restore` → `FlexibleApi`: the available restore destinations and
 * the restore action itself.
 *
 * Each endpoint wraps the existing `fetch*` helper via `queryFn`, preserving its
 * request options, URL and error contract; destinations are parsed into view
 * models on ingress. The parsed models hold `moment` values, which the store's
 * serializableCheck allows (see store.ts).
 */
const flexibleApi = createApi({
	reducerPath: 'flexibleApi',
	baseQuery: fakeBaseQuery<ApiError>(),
	endpoints: (builder) => ({
		getRestoreDestinations: builder.query<RestoreDestinationView[], string>({
			// Drop the cache as soon as the modal closes (no subscribers) so each
			// reopen fetches fresh destinations, matching the legacy per-open fetch.
			keepUnusedDataFor: 0,
			queryFn: async (contentId) => {
				try {
					const raw = await fetchRestoreDestinations(contentId);
					return { data: parseRestoreDestinations(raw) };
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

const { useGetRestoreDestinationsQuery, useRestoreContentMutation } = flexibleApi;

export {
	flexibleApi,
	useGetRestoreDestinationsQuery,
	useRestoreContentMutation,
};
export type { RestoreParams };
