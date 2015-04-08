import angular          from 'angular';
import restoreListCtrl  from './RestoreListCtrl';
import SnapshotListInteractionCtrlMod from './SnapshotListInteractionCtrl';
import SnapshotContentCtrlMod from './SnapshotContentCtrl';

var controllers = angular.module('restorerControllers', [
  'RestoreListCtrlMod',
  'SnapshotListInteractionCtrlMod',
  'SnapshotContentCtrlMod'
]);

export default controllers;
