import angular          from 'angular';
import SnapshotListCtrl  from './SnapshotListCtrl';
import SnapshotContentCtrlMod from './SnapshotContentCtrl';
import ModalCtrlMod from './ModalController';
import RestoreFormCtrlMod from './RestoreFormCtrl';
import ErrorCtrlMod from './ErrorCtrl';

var controllers = angular.module('restorerControllers', [
  'SnapshotListCtrlMod',
  'SnapshotContentCtrlMod',
  'ModalCtrlMod',
  'RestoreFormCtrlMod',
  'ErrorCtrlMod'
]);

export default controllers;
