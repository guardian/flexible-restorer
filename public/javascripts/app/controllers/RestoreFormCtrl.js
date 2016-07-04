import angular from 'angular';
import mediator from '../utils/mediator';
import moment   from 'moment';

var RestoreFormCtrlMod = angular.module('RestoreFormCtrlMod', []);

RestoreFormCtrlMod.controller('RestoreFormCtrl', [
    '$scope',
    '$routeParams',
    'RestoreService',
    'SnapshotIdModels',
    'DateFormatService',
    function($scope, $routeParams, RestoreService, SnapshotIdModels, DateFormatService){

        $scope.isLoading = false;

        this.restore = function() {
            $scope.isLoading = true;
            RestoreService
                .restore($scope.selectedDestination.systemId)
                .then((data) => {
                    //redirect back to composer
                    var env = window.location.origin.split('.')[1];
                    var url = $scope.selectedDestination.composerPrefix;
                    window.location.href = `${url}/content/${$routeParams.contentId}`;
                })
                .catch((err) => mediator.publish('error', err));
        };

        mediator.subscribe('snapshot-list:display-modal', loadSourceAndDestinations);

        function loadSourceAndDestinations(){
            RestoreService
                .getDestinations($routeParams.contentId)
                .then((destinations)=> {
                    $scope.destinations = destinations.map((dest) => {
                        if (dest.changeDetails) {
                            var lastModified = moment(dest.changeDetails.lastModified);
                            var formattedDate = DateFormatService.formatHtml(lastModified);
                            dest.changeString = `currently has revision ${dest.changeDetails.revisionId}, last modified at ${formattedDate}`;
                        } else if (dest.available) {
                            dest.changeString = "content not on this instance";
                        } else {
                            dest.changeString = "";
                        }
                        return dest;
                    });
                    debugger;
                    SnapshotIdModels.getCollection($routeParams.contentId)
                        .then((collection) => {
                            //get model
                            var model = collection.find((data) => data.activeState);

                            // set source info
                            $scope.snapshotRevisionId = model.getRevisionId();
                            $scope.snapshotSystem = model.getSystem();
                            $scope.snapshotCreatedDate = model.getCreatedDateHtml();

                            var systemId = model.getSystemId();
                            var destination = destinations.find((d) => d.systemId == systemId);
                            $scope.selectedDestination = destination || destinations[0];
                        })
                        .catch(() => {
                            $scope.selectedDestination = null;
                        });
                })
                .catch(()=> {
                    $scope.destinations = [];
                });
        }

        mediator.subscribe('snapshot-list:hidden-modal', resetModalForm);

        function resetModalForm(){
            $scope.destinations = [];
            $scope.snapshotRevisionId = null;
            $scope.snapshotSystem = null;
            $scope.snapshotCreatedDate = null;
            $scope.isLoading = false;
            $scope.selfInContent = false;
            $scope.elseInContent = false;
        }

    }
]);

export default RestoreFormCtrlMod;
