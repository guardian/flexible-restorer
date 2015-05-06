import angular      from 'angular';
import ngRoute      from 'angular-route/angular-route';
import ngSanitize   from 'angular-sanitize/angular-sanitize';

import controllers  from './controllers/index';
import models       from './models/index';
import collections  from  './collections/index';
import services     from './services/index';

import components   from 'composer-components';

var restorer = angular.module('restorer', [
  'ngRoute',
  'ngSanitize',
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
      controller: 'SnapshotListCtrl'
    });

    $routeProvider.when('/', {
      templateUrl: '/assets/javascripts/app/templates/splash-screen.html'
    });

    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
  }
]);

//We use thr un block within the main bootstrap file
//to require in GLOBAL deps.
restorer.run(['MixpanelService', function(){}])

export default restorer;
