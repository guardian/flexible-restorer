import angular from 'angular';

var SnapshotListInteractionCtrlMod = angular.module('SnapshotListInteractionCtrlMod', []);

var SnapshotListInteractionCtrl = SnapshotListInteractionCtrlMod.controller('SnapshotListInteractionCtrl', [
  '$scope',
  function($scope){

    this.onItemClicked = (model, collection) => {
      //toggle the active states
      var activeModel = collection.find((model)=> model.get('activeState') === true);
      activeModel.set('activeState', false);
      model.set('activeState', true);
    }

  }
]);

export default SnapshotListInteractionCtrlMod;
