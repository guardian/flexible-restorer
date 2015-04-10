import angular from 'angular';
import SnapshotModel from '../models/SnapshotModel';
import SnapshotCollectionMod from '../services/SnapshotCollectionService';

let cache = {};

var SnapshotModelsMod = angular.module('SnapshotModelsMod', ['SnapshotServiceMod']);

var SnapshotModels = SnapshotModelsMod.factory('SnapshotModels', [
  '$q',
  'SnapshotService',
  'SnapshotModel',
  function($q, SnapshotService, SnapshotModel){

    class SnapshotModels {
      constructor(models){
        this.models = models.map((model) => new SnapshotModel.getModel(model)).sort(this.comparator);
        this.getModelAt(0).set('activeState', true);
      }

      comparator(modelA, modelB){
        return modelA.get('createdDate').isBefore(modelB.get('createdDate')) ? 1 : -1;
      }

      getModels(){
        return this.models;
      }

      getModelAt(index) {
        return this.models[index];
      }

      find(predicate) {
        return this.models.find((model)=> predicate.call(model, model.data));
      }

      indexOf(model) {
        return this.models.indexOf(model);
      }

      length() {
        return this.models.length;
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
                resolve(new SnapshotModels(data));
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
