import angular from 'angular';
import SnapshotServiceMod from '../services/SnapshotCollectionService';

var restoreListCtrlMod = angular.module('RestoreListCtrlMod', []);

var restoreListCtrl = restoreListCtrlMod.controller('RestoreListCtrl', [
  '$scope',
  '$routeParams',
  'SnapshotService',
  function($scope, $routeParams, SnapshotService){
    $scope.isLoading  = true;
    $scope.hasError   = false;
    SnapshotService
      .get($routeParams.contentId)
      .success((data, status, header, config)=>{
          $scope.isLoading = false;
          $scope.models = data.map((model) => Object.keys(model)[0]);
      })
      .error((data, status, header, config)=>{
        $scope.hasError = true;
      })
  }
]);

export default restoreListCtrlMod;
