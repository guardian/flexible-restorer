import angular from 'angular';
import mediator from '../utils/mediator';

var SnapshotListInteractionCtrlMod = angular.module('SnapshotListInteractionCtrlMod', []);

SnapshotListInteractionCtrlMod.controller('SnapshotListInteractionCtrl', [
  '$scope',
  function($scope){

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
    });

    // DISPLAY HTML
    this.onItemClicked = (index) => {
      setState('html');
      mediator.publish('snapshot-list:display-html');
      mediator.publish('snapshot-list:set-active', index);
    };

    // DISPLAY MODAL
    this.onRestoreClicked = function(){
      setState('modal');
      mediator.publish('snapshot-list:display-modal');
    };

    // DISPLAY JSON VIEW
    this.onJSONClicked = function(){
      setState('json');
      mediator.publish('snapshot-list:display-json');
    };

    window.addEventListener('copy', function(e){
      // get the selected content
      var selection = window.getSelection();
      var range = selection.getRangeAt(0);
      var content = range.cloneContents();
      var div = document.createElement('div');
      div.appendChild(content);
      content = div.innerHTML;
      //send it off
      mediator.publish('mixpanel:copy-content', content);
    })

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
        case 37: // LEFT KEY
          e.preventDefault();
          if (!$scope.isDisplayingModal) {
            setState('html');
            mediator.publish('snapshot-list:display-html');
          }
        break;
        case 39: // RIGHT KEY
          e.preventDefault();
          if (!$scope.isDisplayingModal) {
            setState('json');
            mediator.publish('snapshot-list:display-json');
          }
        break;
      }

    });

  }
]);

export default SnapshotListInteractionCtrlMod;
