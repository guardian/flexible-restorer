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
    // Exposed for the migrated React sidebar, bound via
    // <snapshot-sidebar content-id="contentId"> (see components/index.js).
    $scope.contentId = $routeParams.contentId;

    SnapshotIdModels
      .getCollection($routeParams.contentId)
      .then((collection) => {
        snapshotCollection = collection;
        snapshotCollection.getModelAt(0).set('activeState', true);
        $scope.isLoading  = false;
        $scope.models = collection.getModels();
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

    function setActive(activeModel, model) {
      //set active states
      activeModel.set('activeState', false);
      model.set('activeState', true);
      mediator.publish('track:event', 'Snapshot', 'Active', null, null, {
        contentId: model.id,
        snapshotTime: model.timestamp
      });
      //place the content
      $timeout(()=>
          mediator.publish('snapshot-list:load-content', model.getSystemId(), model.getContentId(), model.getTimestamp()), 10
      );
    }

  }
]);

export default SnapshotListCtrlMod;
