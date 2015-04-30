import angular from 'angular';
import SnapshotModelsMod from '../collections/SnapshotModels';
import mediator from '../utils/mediator';

var SnapshotListCtrlMod = angular.module('SnapshotListCtrlMod', []);

SnapshotListCtrlMod.controller('SnapshotListCtrl', [
  '$scope',
  '$routeParams',
  '$timeout',
  'SnapshotService',
  'SnapshotModels',
  'MixpanelService',
  function($scope, $routeParams, $timeout, SnapshotService, SnapshotModels, MixpanelService){

    var snapshotCollection;

    $scope.isLoading  = true;
    $scope.isSidebarActive = false;

    SnapshotModels
      .getCollection($routeParams.contentId)
      .then((collection) => {
        snapshotCollection = collection;
        snapshotCollection.getModelAt(0).set('activeState', true);
        $scope.isLoading  = false;
        $scope.models = collection.getModels();

        var activeModel = collection.find((data)=> data.activeState);
        $scope.articleTitle = activeModel.getHeadline();
        $scope.articleHash = activeModel.get('id');

        //animate sidebar in
        $timeout(()=> $scope.isSidebarActive = true, 500);

      })
      .catch((err) => {
        $scope.isLoading = false;
        mediator.publish('error', err);
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
      mediator.publish('mixpanel:view-snapshot', model.getJSON());
      //place the content
      $timeout(()=> mediator.publish('snapshot-list:display-content', model), 1);
    }

  }
]);

export default SnapshotListCtrlMod;
