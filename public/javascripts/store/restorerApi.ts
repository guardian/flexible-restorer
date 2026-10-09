import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { parseSnapshot, parseVersions } from '../models';
import type { Destination, Permissions, Snapshot, SnapshotArgs, User, Version } from '../models';

const encode = encodeURIComponent;

export const restorerApi = createApi({
    reducerPath: 'restorerApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api/1/',
        credentials: 'same-origin',
        prepareHeaders: (headers) => {
            const token = document.cookie.split('; ').find((cookie) => cookie.startsWith('XSRF-TOKEN='))?.slice('XSRF-TOKEN='.length);
            if (token) headers.set('X-XSRF-TOKEN', decodeURIComponent(token));
            headers.set('X-Requested-With', 'XMLHttpRequest');
            return headers;
        },
    }),
    tagTypes: ['Versions', 'Destinations'],
    endpoints: (builder) => ({
        getVersions: builder.query<Version[], string>({
            query: (contentId) => `versionList/${encode(contentId)}`,
            transformResponse: parseVersions,
            providesTags: (_result, _error, id) => [{ type: 'Versions', id }],
        }),
        getSnapshot: builder.query<Snapshot, SnapshotArgs>({
            query: ({ systemId, contentId, timestamp }) => `version/${encode(systemId)}/${encode(contentId)}/${encode(timestamp)}`,
            transformResponse: parseSnapshot,
        }),
        getUser: builder.query<User, void>({ query: () => 'user' }),
        getPermissions: builder.query<Permissions, void>({ query: () => 'user/permissions' }),
        getDestinations: builder.query<Destination[], string>({
            query: (contentId) => `restore/destinations/${encode(contentId)}`,
            providesTags: (_result, _error, id) => [{ type: 'Destinations', id }],
        }),
        restore: builder.mutation<string, SnapshotArgs & { destinationId: string }>({
            query: ({ systemId, contentId, timestamp, destinationId }) => ({
                url: `restore/${encode(systemId)}/${encode(contentId)}/${encode(timestamp)}/to/${encode(destinationId)}`,
                method: 'POST',
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, error, { contentId }) => error ? [] : [
                { type: 'Versions', id: contentId }, { type: 'Destinations', id: contentId },
            ],
        }),
    }),
});

export const { useGetVersionsQuery, useGetSnapshotQuery, useGetUserQuery, useGetPermissionsQuery, useGetDestinationsQuery, useRestoreMutation } = restorerApi;