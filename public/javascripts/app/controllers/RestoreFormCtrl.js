import angular from 'angular';
import mediator from '../utils/mediator';

var RestoreFormCtrlMod = angular.module('RestoreFormCtrlMod', []);

RestoreFormCtrlMod.controller('RestoreFormCtrl', [
  '$scope',
  'RestoreService',
  function($scope, RestoreService){

    $scope.isLoading = false;

    this.onSubmit = function onRestoreFormSubmit(){
      //PLACEHOLDER
      //TODO ADD POST JP 13/4/15
      $scope.isLoading = true;
      RestoreService.restore();
    };

    mediator.subscribe('snapshot-list:hidden-modal', resetModalForm);

    function resetModalForm(){
      $scope.isLoading = false;
      $scope.selfInContent = false;
      $scope.elseInContent = false;
    }

  }
]);

export default RestoreFormCtrlMod;
