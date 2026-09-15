// Current-user fetch layer for the React restore modal. Mirrors the legacy
// AngularJS `UserService`: the user and their permissions are fetched together
// and the request is memoised so concurrent callers share a single chain. On
// failure the memoised promise is discarded so the next call can retry.

type UserPermissions = {
	restore_content_to_any_stack?: boolean;
	restore_content?: boolean;
};

type User = {
	permissions?: UserPermissions;
};

let userRequest: Promise<User> | undefined;

const getJson = async <T>(url: string): Promise<T> => {
	const response = await fetch(url, {
		headers: { Accept: 'application/json' },
		credentials: 'same-origin',
	});
	if (!response.ok) {
		throw new Error(`Failed to load ${url} (${response.status})`);
	}
	return (await response.json()) as T;
};

const fetchUserWithPermissions = async (): Promise<User> => {
	const user = await getJson<User>('/api/1/user');
	const permissions = await getJson<UserPermissions>('/api/1/user/permissions');
	return { ...user, permissions };
};

/**
 * Resolve the current user (with their permissions), sharing a single memoised
 * request across callers. The rejection is not cached so a later call retries.
 */
const fetchUser = (): Promise<User> => {
	if (!userRequest) {
		userRequest = fetchUserWithPermissions().catch((error: unknown) => {
			userRequest = undefined;
			throw error;
		});
	}
	return userRequest;
};

export { fetchUser };
export type { User, UserPermissions };
