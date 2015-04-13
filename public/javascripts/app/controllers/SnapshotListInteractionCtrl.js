import angular from 'angular';
import mediator from '../utils/mediator';

var SnapshotListInteractionCtrlMod = angular.module('SnapshotListInteractionCtrlMod', []);

var SnapshotListInteractionCtrl = SnapshotListInteractionCtrlMod.controller('SnapshotListInteractionCtrl', [
  '$scope',
  '$timeout',
  function($scope, $timeout){

    $scope.isDisplayingHTML   = true;
    $scope.isDisplayingJSON   = false;
    $scope.isDisplayingModal  = false;

    //SETS THE CURRENT STATE OF THE UI
    //THIS CAN ONLY BE 'json' || 'html' || 'modal';
    function setState(state) {
      $scope.isDisplayingHTML   = (state === 'html')  ? true : false;
      $scope.isDisplayingJSON   = (state === 'json')  ? true : false;
      $scope.isDisplayingModal  = (state === 'modal') ? true : false;
    }

    //REACT TO WHEN THE MODAL IS CLOSED
    //WE SET THE STATE TO THE DEFAULT HTML STATE
    //THIS IS MUCH SIMPLER THAT TRACKING THE LAST STATE BEFORE THE MODAL OPENS
    mediator.subscribe('snapshot-list:hidden-modal', ()=> {
      setState('html');
      mediator.publish('snapshot-list:display-html');
    });

    // DISPLAY HTML
    this.onItemClicked = (index) => {
      $timeout(() => {
        setState('html');
        mediator.publish('snapshot-list:display-html');
        mediator.publish('snapshot-list:set-active', index);
      }, 1);
    };

    // DISPLAY MODAL
    this.onRestoreClicked = function(){
      setState('modal');
      $timeout(() => mediator.publish('snapshot-list:display-modal'), 1);
    };

    // DISPLAY JSON VIEW
    this.onJSONClicked = function(){
      setState('json');
      $timeout(() => mediator.publish('snapshot-list:display-json'), 1);
    };

    //keypress events
    //todo abstract these into a keyboard interaction controller
    //jp 10-04-15
    window.addEventListener('keydown', function(e){
      // IF WE ARE CURRENTLY DISPLAYING THE MODAL WINDOW
      // WE WANT TO CANCEL ALL KEYBOARD OPERATIONS
      switch(e.keyCode){
        case 40: // DOWN KEY
          if (!$scope.isDisplayingModal) {
            e.preventDefault();
            mediator.publish('snapshot-list:increment-active');
          }
        break;
        case 38:// UP KEY
          if (!$scope.isDisplayingModal) {
            e.preventDefault();
            mediator.publish('snapshot-list:decrement-active');
          }
        break;
        case 13: // ENTER KEY
          if (!$scope.isDisplayingModal) {
            e.preventDefault();
            setState('modal');
            mediator.publish('snapshot-list:display-modal');
          }
        break;
        case 39: // RIGHT KEY
          if (!$scope.isDisplayingModal) {
            e.preventDefault();
            setState('html');
            mediator.publish('snapshot-list:display-html');
          }
        break;
        case 37: // LEFT KEY
          if (!$scope.isDisplayingModal) {
            e.preventDefault();
            setState('json');
            mediator.publish('snapshot-list:display-json');
          }
        break;
      }

    });

  }
]);

export default SnapshotListInteractionCtrlMod;
