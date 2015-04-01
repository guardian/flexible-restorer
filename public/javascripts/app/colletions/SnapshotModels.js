import angular from 'angular';

var SnapshotModelsMod = angular.module('SnapshotModelsMod', []);

var SnapshotModels = SnapshotModelsMod.service('SnapshotModels', [
  function(){
    return {}
  }
]);

export default SnapshotModelsMod;
