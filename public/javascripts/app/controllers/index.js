import angular          from 'angular';
import restoreListCtrl  from './RestoreListCtrl';
import SnapshotListInteractionCtrlMod from './SnapshotListInteractionCtrl';
import SnapshotContentCtrlMod from './SnapshotContentCtrl';
import ModalCtrlMod from './ModalController';

var controllers = angular.module('restorerControllers', [
  'RestoreListCtrlMod',
  'SnapshotListInteractionCtrlMod',
  'SnapshotContentCtrlMod',
  'ModalCtrlMod'
]);

export default controllers;
