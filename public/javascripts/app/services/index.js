import angular from 'angular';
import SnapshotServiceMod from './SnapshotCollectionService';
import RestoreService from './RestoreService';
import AnalyticsServiceMod from './AnalyticsService';
import UserServiceMod from './UserService';
import DateFormatServiceMod from './DateFormatService';

var services = angular.module('restorerServices', [
  'SnapshotServiceMod',
  'RestoreServiceMod',
  'AnalyticsServiceMod',
  'UserServiceMod',
  'DateFormatServiceMod'
]);

export default services;
