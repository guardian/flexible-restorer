import angular from 'angular';

var SnapshotServiceMod = angular.module('SnapshotServiceMod', []);

SnapshotServiceMod.service('SnapshotService', [
  '$http',
  function($http){
    return {
      get: (id) => {
        return $http.get(`/api/1/versions/${id}`);
      }
    }
  }
]);

export default SnapshotServiceMod;