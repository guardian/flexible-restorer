import angular          from 'angular';
import restoreListCtrl  from './RestoreListCtrl';
import SnapshotListInteractionCtrlMod from './SnapshotListInteractionCtrl';
import SnapshotContentCtrlMod from './SnapshotContentCtrl';
import ModalCtrlMod from './ModalController';
import RestoreFormCtrlMod from './RestoreFormCtrl';

var controllers = angular.module('restorerControllers', [
  'RestoreListCtrlMod',
  'SnapshotListInteractionCtrlMod',
  'SnapshotContentCtrlMod',
  'ModalCtrlMod',
  'RestoreFormCtrlMod'
]);

export default controllers;
