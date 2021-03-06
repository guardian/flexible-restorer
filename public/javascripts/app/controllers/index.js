import angular          from 'angular';
import SnapshotListCtrl  from './SnapshotListCtrl';
import SnapshotListInteractionCtrlMod from './SnapshotListInteractionCtrl';
import SnapshotContentCtrlMod from './SnapshotContentCtrl';
import ModalCtrlMod from './ModalController';
import RestoreFormCtrlMod from './RestoreFormCtrl';
import SearchFormCtrlMod from './SearchFormCtrl';
import ErrorCtrlMod from './ErrorCtrl';

var controllers = angular.module('restorerControllers', [
  'SnapshotListCtrlMod',
  'SnapshotListInteractionCtrlMod',
  'SnapshotContentCtrlMod',
  'ModalCtrlMod',
  'RestoreFormCtrlMod',
  'SearchFormCtrlMod',
  'ErrorCtrlMod'
]);

export default controllers;
