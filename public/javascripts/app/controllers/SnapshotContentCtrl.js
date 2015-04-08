import angular from 'angular';
import mediator from '../utils/mediator';

var SnapshotContentCtrlMod = angular.module('SnapshotContentCtrlMod', []);

var SnapshotContentCtrl = SnapshotContentCtrlMod.controller('SnapshotContentCtrl', [
  '$scope',
  '$sanitize',
  function($scope, $sanitize){

    function displayContent(model) {
      $scope.htmlContent = $sanitize(model.getHTMLContent());
    }

    console.log('subscribe');
    mediator.subscribe('snapshot-list:display-content', displayContent);
  }
]);

export default SnapshotContentCtrlMod;
