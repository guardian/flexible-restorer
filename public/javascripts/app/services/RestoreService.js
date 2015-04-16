import angular from 'angular';
import mediator from '../utils/mediator';

var RestoreServiceMod = angular.module('RestoreServiceMod', []);

var RestoreService = RestoreServiceMod.service('RestoreService', [
  '$http',
  '$routeParams',
  '$q',
  'SnapshotModels',
  function($http, $routeParams, $q, SnapshotModels){

    function getRestoreUrl(contentId){
      var env = window.location.origin.split('.')[1];
      var url = (env === 'gutools') ? 'https://composer.gutools.co.uk' : `https://composer.${env}.dev-gutools.co.uk`;
      return `${url}/api/restorer/content/${contentId}`;
    }

    return {
      restore: () => {
        var contentId = $routeParams.contentId;
        var restoreUrl = getRestoreUrl(contentId);
        return $q((resolve, reject) => {
          //get collection
          SnapshotModels.getCollection(contentId)
            .then((collection) => {
              //get model
              var model = collection.find((data)=> data.activeState);
              //make the request
              $http({
                url: restoreUrl,
                method: 'PUT',
                data: model.getJSON(),
                withCredentials: true,
                headers: {
                  'Content-Type': 'application/json;charset=utf-8'
                },
                success: (data) => resolve(data),
                error: (data) => reject(data)
              });
            });
        });
      }
    }
  }
]);

export default RestoreServiceMod;
