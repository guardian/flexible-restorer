import angular from 'angular';
import { react2angular } from 'react2angular';
import { AppHeader } from './AppHeader';
import { SearchForm } from './SearchForm';
import { SnapshotSidebar } from './snapshot-sidebar/SnapshotSidebar';
import { RestoreModal } from './restore-modal/RestoreModal';
import { ContentViewer } from './content-viewer/ContentViewer';
import { ErrorModal } from './error-modal/ErrorModal';
import { provideAngularServices } from './hooks/useAngularRouter';
import { withStore } from './store/withStore';

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

// Register migrated React components as AngularJS directives. Each is wrapped in
// `withStore` so every separate react2angular root shares the single Redux store.
// Usage in templates: <search-form></search-form>.
reactComponents.component('appHeader', react2angular(withStore(AppHeader)));

reactComponents.component('errorModal', react2angular(withStore(ErrorModal)));

reactComponents.component('searchForm', react2angular(withStore(SearchForm), ['initialQuery']));

// Snapshot sidebar (article header + version list + interaction).
// Usage in templates: <snapshot-sidebar content-id="contentId"></snapshot-sidebar>.
reactComponents.component(
  'snapshotSidebar',
  react2angular(withStore(SnapshotSidebar), ['contentId'])
);

// Restore modal ("Before you restore" confirmation form).
// Usage in templates: <restore-modal content-id="contentId"></restore-modal>.
reactComponents.component(
  'restoreModal',
  react2angular(withStore(RestoreModal), ['contentId'])
);

// Snapshot content viewer (article furniture + HTML/JSON body + actions).
// Usage in templates: <snapshot-content-viewer content-id="contentId"></snapshot-content-viewer>.
reactComponents.component(
  'snapshotContentViewer',
  react2angular(withStore(ContentViewer), ['contentId'])
);

// Instantiate the bridge at bootstrap so services are provisioned before any
// React component mounts.
reactComponents.run(['AngularBridgeService', function () {}]);

export default reactComponents;
