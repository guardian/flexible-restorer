import angular from 'angular';

var UserServiceMod = angular.module('UserServiceMod', []);

UserServiceMod.service('UserService', [
    '$http',
    '$q',
    function($http, $q) {
        // The single shared request for the current user and their permissions.
        // It is memoised (see `get` below) so that every caller shares one
        // request chain rather than each starting its own.
        let userRequest;

        // Fetch the user, then their permissions, and return the user with the
        // permissions attached.
        function fetchUserWithPermissions() {
            return $http.get('/api/1/user').then((userResponse) => {
                return $http.get('/api/1/user/permissions').then((permissionsResponse) => {
                    userResponse.data.permissions = permissionsResponse.data;
                    return userResponse.data;
                });
            });
        }

        return {
            /**
             * Resolve the current user (with their permissions).
             *
             * The request is memoised so concurrent callers — e.g.
             * `SnapshotContentCtrl` on page load and `RestoreFormCtrl` when the
             * restore modal opens — share a single `/api/1/user` +
             * `/api/1/user/permissions` chain. Sharing one request avoids the
             * race where independent chains could resolve differently (one
             * failing under load and rejecting its caller with an incomplete
             * user while another succeeded).
             *
             * On failure the memoised request is discarded so the next call can
             * retry, rather than caching the rejection permanently.
             */
            get: () => {
                if (!userRequest) {
                    userRequest = fetchUserWithPermissions().catch((error) => {
                        userRequest = undefined;
                        return $q.reject(error);
                    });
                }
                return userRequest;
            }
        };
    }
]);
