import angular from 'angular';
import mediator from '../utils/mediator';

var ModalCtrlMod = angular.module('ModalCtrlMod', []);

var ModalCtrl = ModalCtrlMod.controller('ModalCtrl', [
  '$scope',
  '$element',
  '$timeout',
  function($scope, $element, $timeout){
    //SETUP
    $scope.isActive = false;

    //remove the inline style which prevents a flash of content
    //if we dont use a timeout the inline style is removed after the sope is parsed
    //this leads to a flash of the modal
    $timeout(()=>$element.attr('style', {display: 'block'}), 200);

    //DOM EVENTS
    window.addEventListener('keydown', function modalOnKeyDown(e){
      if ($scope.isActive && e.keyCode === 27) {
        $scope.isActive = false;
        $scope.$digest();
      }
    });

    //APPLICATION EVENTS
    var showModal = this.showModal = function showModal(){
      $scope.isActive = true;
    }

    var cloaseModal = this.closeModal = function closeModal(){
      $scope.isActive = false;
    }

    mediator.subscribe('snapshot-list:display-modal', showModal);

  }
]);

export default ModalCtrlMod;
