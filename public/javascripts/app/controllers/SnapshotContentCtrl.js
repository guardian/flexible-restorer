import angular from 'angular';
import mediator from '../utils/mediator';
import safeApply from '../utils/safe-apply';

var SnapshotContentCtrlMod = angular.module('SnapshotContentCtrlMod', []);

SnapshotContentCtrlMod.controller('SnapshotContentCtrl', [
  '$scope',
  '$routeParams',
  '$timeout',
  '$sce',
  'SnapshotIdModels',
    'SnapshotModels',
    'UserService',
  function($scope, $routeParams, $timeout, $sce, SnapshotIdModels, SnapshotModels, UserService){

    $scope.isShowingJSON = false;
    $scope.displayButtonLabel = "JSON";
    $scope.copyButtonLabel = "Copy JSON";
    $scope.canRestore =  false;

    UserService.get().then((user) => {
        if(user.permissions && user.permissions.restore_content && user.permissions.restore_content === true) {
          $scope.canRestore = true;
        }
    }).catch ((err) => {
        //send the error via the mediator
        console.log('error', err);
        mediator.publish('error', err);
    });

    //set the initial content
    SnapshotIdModels
      .getCollection($routeParams.contentId)
      .then((collection)=> {
        var model = collection.getModelAt(0);
        loadContent(model.getSystemId(), model.getContentId(), model.getTimestamp());
        mediator.publish('track:event', 'Snapshot', 'Viewed', null, null, {
            contentId: model.id,
            snapshotTime: model.timestamp
        });
      })
      //TODO setup global error handle
      .catch((err)=> mediator.publish('error', err));

    //wait for the system to imform us of content changes
    mediator.subscribe('snapshot-list:load-content', loadContent);
    //mediator.subscribe('snapshot-list:display-content', displayContent);
    mediator.subscribe('snapshot-list:display-json', displayJSON);
    mediator.subscribe('snapshot-list:display-html', displayHTML);
    mediator.subscribe('snapshot-list:hidden-modal', displayHTML);

      //logic for animating and setting content
      function loadContent(systemId, contentId, timestamp) {
          SnapshotModels
              .getSnapshot(systemId, contentId, timestamp)
              .then((model) => {
                  displayContent(model)
              })
              .catch((err) => mediator.publish('error', err));

      }

    //logic for animating and setting content
    function displayContent(model) {
      $scope.isSettingContent = true;
      $scope.htmlContent = $sce.trustAsHtml(model.getHTMLContent());
      $scope.jsonContent = model.getJSON();
      $scope.headline = model.getHeadline();
      $scope.standfirst = model.getStandfirst();
      $scope.trailText = model.getTrailText();

      $scope.copyButtonLabel = "Copy JSON";
      $timeout(() => $scope.isSettingContent = false, 200);
    }

    function displayJSON() {
      safeApply($scope, () => {
          $scope.isShowingJSON = true;
          $scope.displayButtonLabel = "TEXT";
      });
    }

    function displayHTML() {
      safeApply($scope, () => {
          $scope.isShowingJSON = false;
          $scope.displayButtonLabel = "JSON";
      });
    }

    this.toggleJSON = function() {
      if ($scope.isShowingJSON) {
          mediator.publish('snapshot-list:display-html');
      } else {
          mediator.publish('snapshot-list:display-json');
      }
    };

    this.restoreContent = function() {
      mediator.publish('snapshot-list:display-modal');
    }

    this.copyJSON = function() {
      const sillyHacks = document.createElement("textarea");
      sillyHacks.value = $scope.jsonContent;

      document.body.appendChild(sillyHacks);
      sillyHacks.focus();
      sillyHacks.select();

      document.execCommand("copy");

      document.body.removeChild(sillyHacks);
      $scope.copyButtonLabel = "Copied!";
    }
  }

]);

export default SnapshotContentCtrlMod;
