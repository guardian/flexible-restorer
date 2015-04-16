import angular from 'angular';
import SnapshotModel from '../models/SnapshotModel';
import SnapshotCollectionMod from '../services/SnapshotCollectionService';
import BaseCollection from 'composer-components/lib/collections/BaseCollection';

let cache = {};

var SnapshotModelsMod = angular.module('SnapshotModelsMod', ['SnapshotServiceMod']);

SnapshotModelsMod.factory('SnapshotModels', [
  '$q',
  'SnapshotService',
  'SnapshotModel',
  function($q, SnapshotService, SnapshotModel){

    class SnapshotModels extends BaseCollection {
      constructor(models){
        super();
        this.models = models.map((model) => new SnapshotModel.getModel(model)).sort(this.comparator);
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
          if (cache[id]) {
            resolve(cache[id]);
            //short circuit out of the function so we dont perform the AJAX request
            return;
          }

          //get the data from the server and build the new collections
          SnapshotService
              .get(id)
              .success(function(data, status, header, config){
                if (data.length === 0) {
                  reject(new Error('There are no snapshots available for this piece of content'));
                  return;
                }
                cache[id] = new SnapshotModels(data)
                resolve(cache[id]);
              })
              .error(function(data, status, header, config){
                reject(data)
              });
        })
      }
    }
  }
]);

export default SnapshotModelsMod;
