import angular from 'angular';
import SnapshotModels from './SnapshotModels';
import SnapshotIdModels from './SnapshotIdModels';

var collections = angular.module('restorerCollections', [
  'SnapshotModelsMod',
  'SnapshotIdModelsMod'
]);

export default collections;
