import angular from 'angular';

var UserServiceMod = angular.module('UserServiceMod', []);

UserServiceMod.service('UserService', [
  '$http'
  function($http) {
    return {
      get: () => {
        return $http.get('/api/1/user').then((userResponse) => {
          return $http.get('/api/1/user/permissions').then((permissionsResponse) => {
            userResponse.data["permissions"] = permissionsResponse.data;
            return userResponse.data;
          })
        });
      }
    }
  }
]);
