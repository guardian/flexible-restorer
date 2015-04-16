import angular from 'angular';
import mediator from '../utils/mediator';

var RestoreFormCtrlMod = angular.module('RestoreFormCtrlMod', []);

RestoreFormCtrlMod.controller('RestoreFormCtrl', [
  '$scope',
  '$routeParams',
  'RestoreService',
  function($scope, $routeParams, RestoreService){

    $scope.isLoading = false;

    this.onSubmit = function onRestoreFormSubmit(){
      //PLACEHOLDER
      //TODO ADD POST JP 13/4/15
      $scope.isLoading = true;
      RestoreService
      .restore()
      .then((data) => {
        //redirect back to composer
        var env = window.location.origin.split('.')[1];
        var url = (env === 'gutools') ? 'https://composer.gutools.co.uk' : `https://composer.${env}.dev-gutools.co.uk`;
        window.location.href = `${url}/${$routeParams.contentId}`;
      })
      .catch((err) => mediator.publish('error', err));
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
