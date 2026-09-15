import angular from 'angular';
import SnapshotServiceMod from './SnapshotCollectionService';
import AnalyticsServiceMod from './AnalyticsService';
import UserServiceMod from './UserService';
import DateFormatServiceMod from './DateFormatService';

// RestoreService has been migrated to the React restore modal's fetch layer
// (see components/api/fetchRestoreDestinations.ts and restoreContent.ts).
var services = angular.module('restorerServices', [
  'SnapshotServiceMod',
  'AnalyticsServiceMod',
  'UserServiceMod',
  'DateFormatServiceMod'
]);

export default services;
