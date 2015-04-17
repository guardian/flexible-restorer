import angular from 'angular';
import SnapshotServiceMod from './SnapshotCollectionService';
import RestoreService from './RestoreService';

var services = angular.module('restorerServices', [
  'SnapshotServiceMod',
  'RestoreServiceMod'
]);

export default services;
