import angular from 'angular';
import { react2angular } from 'react2angular';
import { SearchForm } from './SearchForm';
import { SnapshotSidebar } from './snapshot-sidebar/SnapshotSidebar';
import { RestoreModal } from './restore-modal/RestoreModal';
import { ContentViewer } from './content-viewer/ContentViewer';
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

// Snapshot sidebar (article header + version list + interaction).
// Usage in templates: <snapshot-sidebar content-id="contentId"></snapshot-sidebar>.
reactComponents.component(
  'snapshotSidebar',
  react2angular(SnapshotSidebar, ['contentId'])
);

// Restore modal ("Before you restore" confirmation form).
// Usage in templates: <restore-modal content-id="contentId"></restore-modal>.
reactComponents.component(
  'restoreModal',
  react2angular(RestoreModal, ['contentId'])
);

// Snapshot content viewer (article furniture + HTML/JSON body + actions).
// Usage in templates: <snapshot-content-viewer content-id="contentId"></snapshot-content-viewer>.
reactComponents.component(
  'snapshotContentViewer',
  react2angular(ContentViewer, ['contentId'])
);

// Instantiate the bridge at bootstrap so services are provisioned before any
// React component mounts.
reactComponents.run(['AngularBridgeService', function () {}]);

export default reactComponents;
