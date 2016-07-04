import angular from 'angular';
import SnapshotServiceMod from './SnapshotCollectionService';
import RestoreService from './RestoreService';
import MixpanelServiceMod from './MixpanelService';
import UserServiceMod from './UserService';
import DateFormatServiceMod from './DateFormatService';

var services = angular.module('restorerServices', [
  'SnapshotServiceMod',
  'RestoreServiceMod',
  'MixpanelServiceMod',
  'UserServiceMod',
  'DateFormatServiceMod'
]);

export default services;
