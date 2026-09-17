import angular from 'angular';

var SnapshotListCtrlMod = angular.module('SnapshotListCtrlMod', []);

// Thin route controller for the versions page. The migrated React components own
// the snapshot list, active selection, content loading and errors (via the Redux
// store); this controller only exposes the route's contentId to the template and
// renders immediately (each React component shows its own loading state).
SnapshotListCtrlMod.controller('SnapshotListCtrl', [
  '$scope',
  '$routeParams',
  function($scope, $routeParams){
    $scope.contentId = $routeParams.contentId;
    $scope.isLoading = false;
  }
]);

export default SnapshotListCtrlMod;
