import { useEffect, useState } from "react";

/* AI generated file
Look at UserService.js and use it as the basis to build a react hook 
for fetching the user data and user permissions data from the api 
and making it available to the client application. output the hook 
to a file adjacent to App.tsx and import it into App.tsx. 
Do not use any angular-related code.
*/

export type UserData = Record<string, unknown>;

let cachedUserData: UserData | null = null;
let cachedPermissions: UserData | null = null;
let cachedError: Error | null = null;
let cachedPromise: Promise<UserData> | null = null;

async function fetchUserData(): Promise<UserData> {
    if (cachedUserData && cachedPermissions) {
        return { ...cachedUserData, permissions: cachedPermissions };
    }

    if (cachedPromise) {
        return cachedPromise;
    }

    cachedPromise = fetch("/api/1/user")
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to fetch user: ${response.statusText}`);
            }
            return response.json();
        })
        .then((userData) => {
            cachedUserData = userData as UserData;
            return fetch("/api/1/user/permissions");
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch permissions: ${response.statusText}`,
                );
            }
            return response.json();
        })
        .then((permissionsData) => {
            cachedPermissions = permissionsData as UserData;
            if (!cachedUserData) {
                cachedUserData = {};
            }
            return { ...cachedUserData, permissions: cachedPermissions };
        })
        .catch((error) => {
            cachedError =
                error instanceof Error ? error : new Error(String(error));
            cachedPromise = null;
            throw cachedError;
        });

    return cachedPromise;
}

export function useUser() {
    const [user, setUser] = useState<UserData | null>(
        cachedUserData
            ? { ...cachedUserData, permissions: cachedPermissions }
            : null,
    );
    const [loading, setLoading] = useState(
        !cachedUserData || !cachedPermissions,
    );
    const [error, setError] = useState<Error | null>(cachedError);

    useEffect(() => {
        let isMounted = true;

        if (!user && !error) {
            setLoading(true);
            fetchUserData()
                .then((result) => {
                    if (isMounted) {
                        setUser(result);
                        setError(null);
                        setLoading(false);
                    }
                })
                .catch((fetchError) => {
                    if (isMounted) {
                        setError(
                            fetchError instanceof Error
                                ? fetchError
                                : new Error(String(fetchError)),
                        );
                        setLoading(false);
                    }
                });
        }

        return () => {
            isMounted = false;
        };
    }, [user, error]);

    return { user, loading, error };
}
