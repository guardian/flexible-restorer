import angular from 'angular';
import mediator from '../utils/mediator';

var SnapshotListInteractionCtrlMod = angular.module('SnapshotListInteractionCtrlMod', []);

var SnapshotListInteractionCtrl = SnapshotListInteractionCtrlMod.controller('SnapshotListInteractionCtrl', [
  '$scope',
  function($scope){

    this.onItemClicked = (model, collection) => {

      //if the model is already active... bail out!
      if (model.get('activeState') === true) {
        return;
      }

      //toggle the active states
      var activeModel = collection.find((model)=> model.get('activeState') === true);
      activeModel.set('activeState', false);
      model.set('activeState', true);

      //tell the application to display content from a model
      mediator.publish('snapshot-list:display-content', model);
    }

    this.onRestoreClicked = function(){
      mediator.publish('snapshot-list:show-modal');
    }

  }
]);

export default SnapshotListInteractionCtrlMod;
