import angular from 'angular';
import mediator from '../utils/mediator';
import SnapshotCollectionMod from '../collections/SnapshotModels';
import safeApply from 'composer-components/lib/utils/safe-apply';

var SnapshotContentCtrlMod = angular.module('SnapshotContentCtrlMod', []);

SnapshotContentCtrlMod.controller('SnapshotContentCtrl', [
  '$scope',
  '$routeParams',
  '$timeout',
  '$sce',
  'SnapshotModels',
  function($scope, $routeParams, $timeout, $sce, SnapshotModels){

    $scope.isShowingJSON = false;

    //set the initial content
    SnapshotModels
      .getCollection($routeParams.contentId)
      .then((collection)=> {
        var model = collection.getModelAt(0);
        displayContent(model);
        mediator.publish('mixpanel:view-snapshot', model);
      })
      //TODO setup global error handle
      .catch((err)=> mediator.publish('error', err));

    //wait for the system to imform us of content changes
    mediator.subscribe('snapshot-list:display-content', displayContent);
    mediator.subscribe('snapshot-list:display-json', displayJSON);
    mediator.subscribe('snapshot-list:display-html', displayHTML);
    mediator.subscribe('snapshot-list:hidden-modal', displayHTML);

    //logic for animating and setting content
    function displayContent(model) {
      $scope.isSettingContent = true;
      $scope.htmlContent = $sce.trustAsHtml(model.getHTMLContent());
      $scope.jsonContent = model.getJSON();
      $scope.headline = model.getHeadline();
      $scope.standfirst = model.getStandfirst();
      $timeout(()=> $scope.isSettingContent = false, 200);
    }

    function displayJSON() {
      safeApply($scope, () => $scope.isShowingJSON = true);
    }

    function displayHTML() {
      safeApply($scope, () => $scope.isShowingJSON = false);
    }

  }

]);

export default SnapshotContentCtrlMod;
