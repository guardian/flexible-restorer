import angular from 'angular';
import SnapshotModel from '../models/SnapshotModel';
import SnapshotCollectionMod from '../services/SnapshotCollectionService';

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
        return modelA.get('createdDate').isBefore(modelB.get('createdDate')) ? -1 : 1;
      }

      getModels(){
        return this.models;
      }

      getModelAt(index) {
        return this.models[index];
      }
    }

    return {
      getCollection: (id) => {
        return $q((resolve, reject)=>{
          SnapshotService
            .get(id)
            .success(function(data, status, header, config){
              resolve(new SnapshotModels(data));
            })
            .error(function(data, status, header, config){
              reject(data)
            })
        })
      }
    }
  }
]);

export default SnapshotModelsMod;
