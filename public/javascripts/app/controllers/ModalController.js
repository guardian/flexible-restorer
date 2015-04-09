import angular from 'angular';
import mediator from '../utils/mediator';

var ModalCtrlMod = angular.module('ModalCtrlMod', []);

var ModalCtrl = ModalCtrlMod.controller('ModalCtrl', [
  '$scope',
  '$element',
  function($scope, $element){
    //SETUP
    $scope.isActive = false;

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

    mediator.subscribe('snapshot-list:show-modal', showModal);
  }
]);

export default ModalCtrlMod;
