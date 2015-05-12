import angular from 'angular';

var UserServiceMod = angular.module('UserServiceMod', []);

UserServiceMod.service('UserService', [
  '$http',
  function($http){
    return {
      get: () => $http.get('/api/1/user')
    }
  }
]);
