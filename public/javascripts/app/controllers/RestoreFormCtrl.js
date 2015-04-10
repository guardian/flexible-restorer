import angular from 'angular';
import mediator from '../utils/mediator';

var RestoreFormCtrlMod = angular.module('RestoreFormCtrlMod', []);

var RestoreFormCtrl = RestoreFormCtrlMod.controller('RestoreFormCtrl', [
  '$scope',
  function($scope){

    $scope.isLoading = false;

    this.onSubmit = function onRestoreFormSubmit(){
      $scope.isLoading = true;
    }

    mediator.subscribe('snapshot-list:hidden-modal', resetModalForm);

    function resetModalForm(){
      $scope.isLoading = false;
      $scope.selfInContent = false;
      $scope.elseInContent = false;
    }

  }
]);

export default RestoreFormCtrlMod;
