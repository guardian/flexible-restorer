import angular from 'angular';
import SnapshotModelsMod from '../collections/SnapshotModels';
import mediator from '../utils/mediator';

var restoreListCtrlMod = angular.module('SnapshotListCtrlMod', []);

var restoreListCtrl = restoreListCtrlMod.controller('SnapshotListCtrl', [
  '$scope',
  '$routeParams',
  '$timeout',
  'SnapshotService',
  'SnapshotModels',
  function($scope, $routeParams, $timeout, SnapshotService, SnapshotModels){

    var snapshotCollection;

    $scope.isLoading  = true;
    $scope.hasError   = false;
    $scope.isSidebarActive = false;

    SnapshotModels
    .getCollection($routeParams.contentId)
    .then((collection) => {
      snapshotCollection = collection;
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

    //set active model to a specific index
    mediator.subscribe('snapshot-list:set-active', function(index){
      var activeModel = snapshotCollection.find((data)=> data.activeState);
      var model = snapshotCollection.getModelAt(index);
      if (activeModel === model) {
        return;
      }
      setActive(activeModel, model);
    });

    //increment the active model
    mediator.subscribe('snapshot-list:increment-active', function(){
      var activeModel = snapshotCollection.find((data)=> data.activeState);
      var index = snapshotCollection.indexOf(activeModel) + 1;
      if (index === snapshotCollection.length()) {
        index = 0;
      }
      var model = snapshotCollection.getModelAt(index);
      setActive(activeModel, model);
    });

    //decrement the active model
    mediator.subscribe('snapshot-list:decrement-active', function(){
      var activeModel = snapshotCollection.find((data)=> data.activeState);
      var index = snapshotCollection.indexOf(activeModel) -1;
      if (index === -1) {
        index = snapshotCollection.length() - 1;
      }
      var model = snapshotCollection.getModelAt(index);
      setActive(activeModel, model);
    });

    function setActive(activeModel, model) {
      //set active states
      activeModel.set('activeState', false);
      model.set('activeState', true);
      //place the content
      $timeout(()=> mediator.publish('snapshot-list:display-content', model), 1);
    }

  }
]);

export default restoreListCtrlMod;
