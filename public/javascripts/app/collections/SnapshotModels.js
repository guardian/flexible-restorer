import angular from 'angular';
import SnapshotModel from '../models/SnapshotModel';
import SnapshotCollectionMod from '../services/SnapshotCollectionService';

let contentCache = {};

var SnapshotModelsMod = angular.module('SnapshotModelsMod', ['SnapshotServiceMod']);

SnapshotModelsMod.factory('SnapshotModels', [
  '$q',
  'SnapshotService',
  'SnapshotModel',
  function($q, SnapshotService, SnapshotModel){

    return {
      getSnapshot: (contentId, timestamp) => {
        return $q((resolve, reject)=>{

          var key = `${contentId}/${timestamp}`;

          //resolve with cache if we already have the collection
          //this also results in collections being singletons within the application
          if (contentCache[key]) {
            resolve(contentCache[key]);
            //short circuit out of the function so we dont perform the AJAX request
            return;
          }

          //get the data from the server and build the new collections
          SnapshotService
              .getSnapshot(contentId, timestamp)
              .success(function(data, status, header, config){
                  contentCache[key] = new SnapshotModel.getModel(timestamp, data);
                resolve(contentCache[key]);
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
