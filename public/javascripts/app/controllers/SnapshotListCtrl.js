import angular from 'angular';
import SnapshotModelsMod from '../collections/SnapshotModels';

var restoreListCtrlMod = angular.module('SnapshotListCtrlMod', []);

var restoreListCtrl = restoreListCtrlMod.controller('SnapshotListCtrl', [
  '$scope',
  '$routeParams',
  '$timeout',
  'SnapshotService',
  'SnapshotModels',
  function($scope, $routeParams, $timeout, SnapshotService, SnapshotModels){

    $scope.isLoading  = true;
    $scope.hasError   = false;
    $scope.isSidebarActive = false;

    SnapshotModels
      .getCollection($routeParams.contentId)
      .then((collection) => {
        $scope.isLoading  = false;
        $scope.models = collection.getModels();

        var activeModel = collection.find((data)=> data.activeState);
        $scope.articleTitle = activeModel.getHeadline();
        $scope.articleHash = activeModel.get('id');

        //animate sidebar in
        $timeout(()=> $scope.isSidebarActive = true, 500);

      })
      .catch((err) => {
        $scope.hasError = true;
      });
  }
]);

export default restoreListCtrlMod;
