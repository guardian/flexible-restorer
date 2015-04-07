import angular          from 'angular';
import restoreListCtrl  from './RestoreListCtrl';
import SnapshotListInteractionCtrlMod from './SnapshotListInteractionCtrl';

var controllers = angular.module('restorerControllers', [
  'RestoreListCtrlMod',
  'SnapshotListInteractionCtrlMod'
]);

export default controllers;
