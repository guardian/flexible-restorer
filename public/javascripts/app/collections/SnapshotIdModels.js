import angular from 'angular';
import BaseCollection from './BaseCollection';

let listCache = {};
// Tracks the collection request that is currently in flight for a given content
// id. Without this, concurrent callers (SnapshotListCtrl, SnapshotContentCtrl,
// RestoreFormCtrl, RestoreService) each miss the cache and fire their own
// request, and the last one to resolve overwrites `listCache[id]` with a fresh
// collection instance. That instance's active model is not the one
// SnapshotListCtrl marked active, so `collection.find(d => d.activeState)`
// returns undefined and the restore modal shows an empty source header. Sharing
// a single in-flight promise guarantees every caller resolves the same
// singleton collection.
let inFlight = {};

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
                //resolve with cache if we already have the collection
                //this also results in collections being singletons within the application
                if (listCache[id]) {
                    return $q.resolve(listCache[id]);
                }

                //share a single request between concurrent callers so they all
                //receive the same collection instance
                if (inFlight[id]) {
                    return inFlight[id];
                }

                const request = SnapshotService
                    .getList(id)
                    .then(function({data}){
                        delete inFlight[id];
                        if (!Array.isArray(data) || data.length === 0) {
                            return $q.reject(new Error('There are no snapshots available for this piece of content'));
                        }
                        listCache[id] = new SnapshotIds(data);
                        return listCache[id];
                    }, function(err){
                        delete inFlight[id];
                        return $q.reject(err);
                    });

                inFlight[id] = request;
                return request;
            }
        }
    }
]);

export default SnapshotIdModelsMod;
