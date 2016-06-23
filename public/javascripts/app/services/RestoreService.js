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
      restore: () => {
        var contentId = $routeParams.contentId;
        return $q((resolve, reject) => {
          //get collection
          SnapshotIdModels.getCollection(contentId)
            .then((collection) => {
              //get model
              var model = collection.find((data) => data.activeState);
              mediator.publish('mixpanel:restore-snapshot', model);
              //make the request
              $http({
                url: `/api/1/restore/${model.getSystemId()}/${contentId}/${model.getTimestamp()}`,
                method: 'POST'
              })
              .success((data)=> resolve(data))
              .error((err)=> reject(err));
            });
        });
      }
    }
  }
]);

export default RestoreServiceMod;
