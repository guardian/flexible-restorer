import angular from 'angular';
import SnapshotModelMod from './SnapshotModel';
import SnapshotIdModelMod from './SnapshotIdModel';

var models = angular.module('restorerModels', [
  'SnapshotModelMod',
  'SnapshotIdModelMod'
]);

export default models;
