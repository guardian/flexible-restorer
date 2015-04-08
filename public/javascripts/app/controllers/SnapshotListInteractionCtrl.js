import angular from 'angular';
import mediator from '../utils/mediator';

var SnapshotListInteractionCtrlMod = angular.module('SnapshotListInteractionCtrlMod', []);

var SnapshotListInteractionCtrl = SnapshotListInteractionCtrlMod.controller('SnapshotListInteractionCtrl', [
  '$scope',
  function($scope){

    this.onItemClicked = (model, collection) => {

      //toggle the active states
      var activeModel = collection.find((model)=> model.get('activeState') === true);
      activeModel.set('activeState', false);
      model.set('activeState', true);

      //tell the application to display content from a model
      mediator.publish('snapshot-list:display-content', model);
    }

  }
]);

export default SnapshotListInteractionCtrlMod;
