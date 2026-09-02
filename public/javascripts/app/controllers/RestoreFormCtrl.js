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
    'UserService',
    function($scope, $routeParams, RestoreService, SnapshotIdModels, DateFormatService, UserService){

        $scope.isLoading = false;

        this.restore = function() {
            $scope.isLoading = true;
            RestoreService
                .restore($scope.selectedDestination.systemId)
                .then((data) => {
                    //redirect back to composer
                    var url = $scope.selectedDestination.composerPrefix;
                    window.location.href = `${url}/content/${$routeParams.contentId}`;
                })
                .catch((err) => mediator.publish('error', err));
        };

        mediator.subscribe('snapshot-list:display-modal', loadSourceAndDestinations);

        function loadSourceAndDestinations(){
            // Resolve the user's permissions before loading destinations so the
            // cross-stack filter below is applied against a settled value.
            // Reading `$scope.canRestoreToAnyStack` directly used to race the
            // (two sequential) user/permissions requests: if the destinations
            // request resolved first the list was wrongly filtered down to the
            // current stack even for users with restore_content_to_any_stack.
            // `UserService.get()` caches, so this adds no extra request cost.
            UserService.get()
                .then((user) => {
                    var canRestoreToAnyStack = !!(user.permissions && user.permissions.restore_content_to_any_stack === true);
                    $scope.canRestoreToAnyStack = canRestoreToAnyStack;
                    return canRestoreToAnyStack;
                })
                .catch(() => false)
                .then((canRestoreToAnyStack) => {
                    return RestoreService
                        .getDestinations($routeParams.contentId)
                        .then((destinations)=> {
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

                                    $scope.destinations = destinations.filter((dest) => {
                                        // only display the destinations that the user can restore to
                                        return canRestoreToAnyStack || dest.systemId === systemId;
                                    }).map((dest) => {
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
                                })
                                .catch(() => {
                                    $scope.selectedDestination = null;
                                });
                        })
                        .catch(()=> {
                            $scope.destinations = [];
                        });
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
