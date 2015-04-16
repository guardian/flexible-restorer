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
      var env = window.location.origin.split('.')[0];
      var url = (env === 'gutools') ? 'https://composer.gutools.co.uk' : `https://composer.${env}.dev-gutools.co.uk`;
      return `${url}/api/restorer/content/${contentId}`
    }

    return {
      restore: () => {
        var contentId = $routeParams.contentId;
        var restoreUrl = getRestoreUrl(contentId);
        return $q((resolve, reject) => {
          //get collection
          return SnapshotModels.getCollection(contentId)
        })
        .then((collection) => {
          //get model
          return collection.find((data)=> !!data.activeState);
        })
        .then((model) => {
          console.log('-----------------------');
          console.log(model);
          console.log('-----------------------');
        });
      }
    }
  }
]);

export default RestoreServiceMod;
