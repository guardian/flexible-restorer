import angular from 'angular';
import SnapshotIdModelsMod from '../collections/SnapshotIdModels';
import mediator from '../utils/mediator';

var SnapshotListCtrlMod = angular.module('SnapshotListCtrlMod', []);

SnapshotListCtrlMod.controller('SnapshotListCtrl', [
  '$scope',
  '$routeParams',
  '$timeout',
  'SnapshotService',
  'SnapshotIdModels',
  function($scope, $routeParams, $timeout, SnapshotService, SnapshotIdModels){

    var snapshotCollection;

    $scope.isLoading  = true;
    $scope.isSidebarActive = false;

    SnapshotIdModels
      .getCollection($routeParams.contentId)
      .then((collection) => {
        snapshotCollection = collection;
        snapshotCollection.getModelAt(0).set('activeState', true);
        $scope.isLoading  = false;
        $scope.models = collection.getModels();

        var activeModel = collection.find((data)=> data.activeState);
        $scope.articleTitle = activeModel.getHeadline();
        $scope.articleHash = activeModel.getContentId();
        $scope.articleURL = [__COMPOSER_DOMAIN__, "content", $scope.articleHash].join("/");
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
        console.log("setting active to something");
      model.set('activeState', true);
      mediator.publish('mixpanel:view-snapshot', model);
      //place the content
      $timeout(()=>
          mediator.publish('snapshot-list:load-content', model.getSystemId(), model.getContentId(), model.getTimestamp()), 10
      );
    }

  }
]);

export default SnapshotListCtrlMod;
