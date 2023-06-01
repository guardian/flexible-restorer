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
      getSnapshot: (systemId, contentId, timestamp) => {
        return $q((resolve, reject)=>{

          var key = `${systemId}/${contentId}/${timestamp}`;

          //resolve with cache if we already have the collection
          //this also results in collections being singletons within the application
          if (contentCache[key]) {
            resolve(contentCache[key]);
            //short circuit out of the function so we dont perform the AJAX request
            return;
          }

          //get the data from the server and build the new collections
          SnapshotService
              .getSnapshot(systemId, contentId, timestamp)
              .then(function(data, status, header, config){
                  contentCache[key] = SnapshotModel.getModel(systemId, timestamp, data);
                resolve(contentCache[key]);
              })
              .catch(function(data, status, header, config){
                reject(data)
              });
        })
      }
    }
  }
]);

export default SnapshotModelsMod;
