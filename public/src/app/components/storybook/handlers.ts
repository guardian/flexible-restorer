import { http, HttpResponse } from 'msw';
import {
	mockPermissions,
	mockRawSnapshot,
	mockRawSnapshotList,
	mockRestoreDestinations,
	mockUser,
} from './mockData';

/** Default MSW handlers for the restorer API; override per story via `parameters.msw.handlers`. */
export const handlers = {
	versionList: http.get('/api/1/versionList/:contentId', () =>
		HttpResponse.json(mockRawSnapshotList),
	),
	version: http.get('/api/1/version/:systemId/:contentId/:timestamp', () =>
		HttpResponse.json(mockRawSnapshot),
	),
	user: http.get('/api/1/user', () => HttpResponse.json(mockUser)),
	permissions: http.get('/api/1/user/permissions', () =>
		HttpResponse.json(mockPermissions),
	),
	destinations: http.get('/api/1/restore/destinations/:contentId', () =>
		HttpResponse.json(mockRestoreDestinations),
	),
	restore: http.post(
		'/api/1/restore/:sourceSystemId/:contentId/:sourceTimestamp/to/:destinationSystemId',
		() => new HttpResponse(null, { status: 200 }),
	),
	telemetry: http.get(
		'*/guardian-tool-accessed',
		() => new HttpResponse(null, { status: 204 }),
	),
};
