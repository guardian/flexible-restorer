import angular from 'angular';
import SnapshotServiceMod from '../services/SnapshotCollectionService';
import SnapshotModelsMod from '../collections/SnapshotModels';

var restoreListCtrlMod = angular.module('RestoreListCtrlMod', []);

var restoreListCtrl = restoreListCtrlMod.controller('RestoreListCtrl', [
  '$scope',
  '$routeParams',
  'SnapshotService',
  'SnapshotModels',
  function($scope, $routeParams, SnapshotService, SnapshotModels){

    $scope.isLoading  = true;
    $scope.hasError   = false;

    SnapshotModels
      .get($routeParams.contentId)
      .then((collection) => {
        $scope.models = collection.getModels();
      })
      .catch((err) => {
        $scope.hasError = true;
      })
  }
]);

export default restoreListCtrlMod;
