import angular from 'angular';
import { react2angular } from 'react2angular';
import { SearchForm } from './SearchForm';
import { provideAngularServices } from './hooks/useAngularRouter';

// AngularJS module hosting the React components bridged in via react2angular.
var reactComponents = angular.module('reactComponents', []);

// Bridge the AngularJS `$location`/`$rootScope` services into React land once
// at bootstrap, so React components can navigate through the useAngularRouter
// hook without having services passed to them as props.
reactComponents.service('AngularBridgeService', [
  '$location',
  '$rootScope',
  function AngularBridgeService($location, $rootScope) {
    provideAngularServices($location, $rootScope);
  }
]);

// Register migrated React components as AngularJS directives.
// Usage in templates: <search-form></search-form>.
reactComponents.component('searchForm', react2angular(SearchForm, ['initialQuery']));

// Instantiate the bridge at bootstrap so services are provisioned before any
// React component mounts.
reactComponents.run(['AngularBridgeService', function () {}]);

export default reactComponents;
