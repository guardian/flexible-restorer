import angular          from 'angular';
import SnapshotListCtrl  from './SnapshotListCtrl';
import SnapshotContentCtrlMod from './SnapshotContentCtrl';
import ErrorCtrlMod from './ErrorCtrl';

// The restore modal (ModalController + RestoreFormCtrl) has been migrated to the
// React `restore-modal` component (see components/restore-modal).
var controllers = angular.module('restorerControllers', [
  'SnapshotListCtrlMod',
  'SnapshotContentCtrlMod',
  'ErrorCtrlMod'
]);

export default controllers;
