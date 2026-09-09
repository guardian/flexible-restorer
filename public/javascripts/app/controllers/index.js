import angular          from 'angular';
import SnapshotListCtrl  from './SnapshotListCtrl';
import ErrorCtrlMod from './ErrorCtrl';

// The restore modal (ModalController + RestoreFormCtrl) and the content panel
// (SnapshotContentCtrl) have been migrated to React (see components/restore-modal
// and components/content-viewer).
var controllers = angular.module('restorerControllers', [
  'SnapshotListCtrlMod',
  'ErrorCtrlMod'
]);

export default controllers;
