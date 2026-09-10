import angular from 'angular';
import BaseCollection from './BaseCollection';
import { fetchSnapshotList } from '../components/api/fetchSnapshotList';

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

var SnapshotIdModelsMod = angular.module('SnapshotIdModelsMod', []);

SnapshotIdModelsMod.factory('SnapshotIdModels', [
    '$q',
    'SnapshotIdModel',
    function($q, SnapshotIdModel){

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

                // `fetchSnapshotList` is shared with the React sidebar; it applies
                // the "no snapshots" contract and returns the raw version list.
                // `$q.when` adopts the native promise so resolution triggers a
                // digest.
                const request = $q
                    .when(fetchSnapshotList(id))
                    .then(function(data){
                        delete inFlight[id];
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
