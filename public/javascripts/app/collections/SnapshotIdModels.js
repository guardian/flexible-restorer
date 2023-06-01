import angular from 'angular';
import BaseCollection from './BaseCollection';

let listCache = {};

var SnapshotIdModelsMod = angular.module('SnapshotIdModelsMod', ['SnapshotServiceMod']);

SnapshotIdModelsMod.factory('SnapshotIdModels', [
    '$q',
    'SnapshotService',
    'SnapshotIdModel',
    function($q, SnapshotService, SnapshotIdModel){

        class SnapshotIds extends BaseCollection {
            constructor(models){
                super();
                this.models = models.map((snapshot) => SnapshotIdModel.getModel(snapshot)).sort(this.comparator);
            }

            comparator(modelA, modelB){
                return modelA.get('createdDate').isBefore(modelB.get('createdDate')) ? 1 : -1;
            }
        }

        return {
            getCollection: (id) => {
                return $q((resolve, reject)=>{

                    //resolve with cache if we already have the collection
                    //this also results in collections being singletons within the application
                    if (listCache[id]) {
                        resolve(listCache[id]);
                        //short circuit out of the function so we dont perform the AJAX request
                        return;
                    }

                    //get the data from the server and build the new collections
                    SnapshotService
                        .getList(id)
                        .then(function(data, status, header, config){
                            if (!Array.isArray(data) || data.length === 0) {
                                reject(new Error('There are no snapshots available for this piece of content'));
                                return;
                            }
                            listCache[id] = new SnapshotIds(data);
                            resolve(listCache[id]);
                        })
                        .catch(function(data, status, header, config){
                            reject(data)
                        });
                })
            }
        }
    }
]);

export default SnapshotIdModelsMod;
