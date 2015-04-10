import angular from 'angular';

var RestoreFormCtrlMod = angular.module('RestoreFormCtrlMod', []);

var RestoreFormCtrl = RestoreFormCtrlMod.controller('RestoreFormCtrl', [
  '$scope',
  function($scope){

    $scope.isLoading = false;

    this.onSubmit = function onRestoreFormSubmit(){
      $scope.isLoading = true;
      console.log('submit');
    }
  }
]);

export default RestoreFormCtrlMod;
