import angular from 'angular';
import mediator from '../utils/mediator';

var SnapshotListInteractionCtrlMod = angular.module('SnapshotListInteractionCtrlMod', []);

var SnapshotListInteractionCtrl = SnapshotListInteractionCtrlMod.controller('SnapshotListInteractionCtrl', [
  '$scope',
  '$timeout',
  function($scope, $timeout){

    this.onItemClicked = (index) => {
      $timeout(() => {
        mediator.publish('snapshot-list:display-html');
        mediator.publish('snapshot-list:set-active', index);
      }, 1);
    }

    this.onRestoreClicked = function(){
      $timeout(() => mediator.publish('snapshot-list:display-modal'), 1);
    }

    this.onJSONClicked = function(){
      $timeout(() => mediator.publish('snapshot-list:display-json'), 1);
    }

    //keypress events
    //todo abstract these into a keyboard interaction controller
    //jp 10-04-15
    window.addEventListener('keydown', function(e){
      switch(e.keyCode){
        case 40:
          e.preventDefault();
        mediator.publish('snapshot-list:increment-active');
        break;
        case 38:
          e.preventDefault();
        mediator.publish('snapshot-list:decrement-active');
        break;
        case 13:
          e.preventDefault();
        mediator.publish('snapshot-list:display-modal');
        break;
        case 39:
          e.preventDefault();
        mediator.publish('snapshot-list:display-html');
        break;
        case 37:
          e.preventDefault();
        mediator.publish('snapshot-list:display-json');
        break;
      }

    });

  }
]);

export default SnapshotListInteractionCtrlMod;
