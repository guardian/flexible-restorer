import angular from 'angular';
import mediator from '../utils/mediator';
import SnapshotCollectionMod from '../collections/SnapshotModels';

var SnapshotContentCtrlMod = angular.module('SnapshotContentCtrlMod', []);

var SnapshotContentCtrl = SnapshotContentCtrlMod.controller('SnapshotContentCtrl', [
  '$scope',
  '$sanitize',
  '$routeParams',
  '$timeout',
  '$element',
  'SnapshotModels',
  function($scope, $sanitize, $routeParams, $timeout, $element, SnapshotModels){

    $scope.isShowingHtml = true;

    //set the initial content
    SnapshotModels
    .getCollection($routeParams.contentId)
    .then((collection)=> {
      displayContent(collection.getModelAt(0));
    })
    //TODO setup global error handle
    .catch((err)=> console.log(err))

    //wait for the system to imform us of content changes
    mediator.subscribe('snapshot-list:display-content', displayContent);
    mediator.subscribe('snapshot-list:display-json', displayJSON);
    mediator.subscribe('snapshot-list:display-html', displayHTML);

    //logic for animating and setting content
    function displayContent(model) {
      $scope.isSettingContent = true;
      $scope.htmlContent = $sanitize(model.getHTMLContent());
      $scope.jsonContent = model.toJSON();
      $timeout(()=> $scope.isSettingContent = false, 100);
    }

    function displayJSON() {
      $scope.isShowingHtml = false;
    }

    function displayHTML() {
      $scope.isShowingHtml = true;
    }

  }

]);

export default SnapshotContentCtrlMod;
