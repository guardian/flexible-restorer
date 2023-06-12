import angular from 'angular';
import mediator from '../utils/mediator';

var RestoreServiceMod = angular.module('RestoreServiceMod', []);

var RestoreService = RestoreServiceMod.service('RestoreService', [
    '$http',
    '$routeParams',
    '$q',
    'SnapshotIdModels',
    function($http, $routeParams, $q, SnapshotIdModels){

        return {
            restore: (destinationSystemId) => {
                var contentId = $routeParams.contentId;
                return $q((resolve, reject) => {
                    //get collection
                    SnapshotIdModels.getCollection(contentId)
                        .then((collection) => {
                            //get model
                            var model = collection.find((data) => data.activeState);
                            var systemId = destinationSystemId || model.getSystemId();

                            mediator.publish('track:event', 'Snapshot', 'Restored', null, null, {
                                contentId: model.id,
                                snapshotTime: model.timestamp
                            });

                            //make the request
                            $http({
                                url: `/api/1/restore/${model.getSystemId()}/${contentId}/${model.getTimestamp()}/to/${systemId}`,
                                method: 'POST'
                            })
                                .then(resolve)
                                .catch(reject);
                        });
                });
            },
            getDestinations: (contentId) => {
                return $q((resolve, reject) => {
                    $http.get(`/api/1/restore/destinations/${contentId}`)
                        .then(function({data}){
                            if (!Array.isArray(data) || data.length === 0) {
                                reject(new Error('There are no destinations available'));
                                return;
                            }
                            resolve(data);
                        })
                        .catch(reject);
                });
            }
        }
    }
]);

export default RestoreServiceMod;
