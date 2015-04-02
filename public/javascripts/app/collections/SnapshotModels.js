import angular from 'angular';
import SnapshotModel from '../models/SnapshotModel';
import SnapshotCollectionMod from '../services/SnapshotCollectionService';

var SnapshotModelsMod = angular.module('SnapshotModelsMod', ['SnapshotServiceMod']);

var SnapshotModels = SnapshotModelsMod.service('SnapshotModels', [
  '$q',
  'SnapshotService',
  'SnapshotModel',
  function($q, SnapshotService, SnapshotModel){

    class SnapshotModels {
      constructor(models){
        this.models = models.map((model) => new SnapshotModel.getModel(model)).sort(this.comparator);
      }

      comparator(modelA, modelB){
        return modelA.get('createdDate').isBefore(modelB.get('createdDate')) ? -1 : 1;
      }

      getModels(){
        return this.models;
      }
    }

    return {
      get: (id) => {
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
