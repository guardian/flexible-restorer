import angular from 'angular';
import mediator from '../utils/mediator';

var SnapshotListInteractionCtrlMod = angular.module('SnapshotListInteractionCtrlMod', []);

var SnapshotListInteractionCtrl = SnapshotListInteractionCtrlMod.controller('SnapshotListInteractionCtrl', [
  '$scope',
  function($scope){

    this.onItemClicked = (index) => {
      mediator.publish('snapshot-list:set-active', index);
    }

    this.onRestoreClicked = function(){
      mediator.publish('snapshot-list:display-modal');
    }

    this.onJSONClicked = function(){
      mediator.publish('snapshot-list:display-json');
    }

    //keypress events
    //todo abstract these into a keyboard interaction controller
    //jp 10-04-15
    window.addEventListener('keydown', function(e){
      if (e.keyCode === 40) {
        e.preventDefault();
        mediator.publish('snapshot-list:increment-active');
      }
      else if (e.keyCode === 38) {
        e.preventDefault();
        mediator.publish('snapshot-list:decrement-active');
      }
      else if (e.keyCode === 13) {
        mediator.publish('keypress:enter', e);
      }
    });

  }
]);

export default SnapshotListInteractionCtrlMod;
