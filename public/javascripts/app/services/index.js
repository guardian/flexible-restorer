import angular from 'angular';
import AnalyticsServiceMod from './AnalyticsService';
import UserServiceMod from './UserService';
import DateFormatServiceMod from './DateFormatService';

// RestoreService has been migrated to the React restore modal's fetch layer
// (see components/api/fetchRestoreDestinations.ts and restoreContent.ts).
// SnapshotService/SnapshotModels were removed with the React content-viewer
// migration (see components/api/fetchSnapshot.ts).
var services = angular.module('restorerServices', [
  'AnalyticsServiceMod',
  'UserServiceMod',
  'DateFormatServiceMod'
]);

export default services;
