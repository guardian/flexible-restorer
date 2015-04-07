import angular from 'angular';

var SnapshotListInteractionCtrlMod = angular.module('SnapshotListInteractionCtrlMod', []);

var SnapshotListInteractionCtrl = SnapshotListInteractionCtrlMod.controller('SnapshotListInteractionCtrl', [
  '$scope',
  function($scope){

    this.onItemClicked = (model) => {
      console.log('-----------------------');
      console.log('clicked', model);
      console.log('-----------------------');
    }
  }
]);

export default SnapshotListInteractionCtrlMod;
