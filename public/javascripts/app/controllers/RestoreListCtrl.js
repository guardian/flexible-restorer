import angular from 'angular';
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
      .getCollection($routeParams.contentId)
      .then((collection) => {
        $scope.isLoading  = false;
        $scope.models = collection.getModels();
      })
      .catch((err) => {
        $scope.hasError = true;
      });
  }
]);

export default restoreListCtrlMod;
