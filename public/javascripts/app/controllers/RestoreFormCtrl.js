import angular from 'angular';
import mediator from '../utils/mediator';

var RestoreFormCtrlMod = angular.module('RestoreFormCtrlMod', []);

RestoreFormCtrlMod.controller('RestoreFormCtrl', [
    '$scope',
    '$routeParams',
    'RestoreService',
    'SnapshotIdModels',
    function($scope, $routeParams, RestoreService, SnapshotIdModels){

        $scope.isLoading = false;

        this.onSubmit = function onRestoreFormSubmit(){
            //PLACEHOLDER
            //TODO ADD POST JP 13/4/15
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

        mediator.subscribe('snapshot-list:display-modal', loadDestinations);

        function loadDestinations(){
            RestoreService
                .getDestinations($routeParams.contentId)
                .then((destinations)=> {
                    $scope.destinations = destinations;
                    SnapshotIdModels.getCollection($routeParams.contentId)
                        .then((collection) => {
                            //get model
                            var model = collection.find((data) => data.activeState);
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
            $scope.isLoading = false;
            $scope.selfInContent = false;
            $scope.elseInContent = false;
        }

    }
]);

export default RestoreFormCtrlMod;
