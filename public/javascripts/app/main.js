import angular from 'angular';
import ngRoute from 'angular-route/angular-route';

import controllers  from './controllers/index';
import models       from './models/index';
import collections  from  './colletions/index';
import services     from './services/index';

import components   from 'composer-components';

var restorer = angular.module('restorer', [
  'ngRoute',
  'guComponents',
  'restorerControllers',
  'restorerModels',
  'restorerCollections',
  'restorerServices'
]);

restorer.config([
  '$routeProvider',
  '$locationProvider',
  function($routeProvider, $locationProvider){

    $routeProvider.when('/content/:contentId/versions', {
      templateUrl: '/assets/javascripts/app/templates/restore-list.html',
      controller: 'RestoreListCtrl'
    })

    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
  }
]);

export default restorer;
