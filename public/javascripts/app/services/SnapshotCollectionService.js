import angular from 'angular';

var SnapshotServiceMod = angular.module('SnapshotServiceMod', []);

SnapshotServiceMod.service('SnapshotService', [
  '$http',
  function($http){
    return {
      get: (id) => $http.get(`/api/1/versions/${id}`),
      getList: (id) => $http.get(`/api/1/versionList/${id}`),
      getSnapshot: (contentId, timestamp) => $http.get(`/api/1/version/${contentId}/${timestamp}`)
    }
  }
]);

export default SnapshotServiceMod;
