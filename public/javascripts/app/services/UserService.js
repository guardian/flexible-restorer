import angular from 'angular';

var UserServiceMod = angular.module('UserServiceMod', []);

let userData;

UserServiceMod.service('UserService', [
  '$http',
    '$q',
  function($http, $q) {
    return {
      get: () => {
        return $q((resolve, reject) => {
            if (userData) {
                resolve(userData);
                return;
            }

            $http.get('/api/1/user').
            then((userResponse) => {
                $http.get('/api/1/user/permissions').
                then((permissionsResponse) => {
                    userResponse.data["permissions"] = permissionsResponse.data;
                    userData = userResponse.data;
                    resolve(userData);
                }).
                catch((data) => {
                    reject(data);
                });
            }).
            catch((data) =>
                reject(data)
            );
        })
      }
    }
  }
]);
