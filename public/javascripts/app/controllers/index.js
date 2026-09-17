import angular          from 'angular';
import SnapshotListCtrl  from './SnapshotListCtrl';

// The restore modal (ModalController + RestoreFormCtrl) and the content panel
// (SnapshotContentCtrl), plus the error modal, have been migrated to React.
var controllers = angular.module('restorerControllers', [
  'SnapshotListCtrlMod'
]);

export default controllers;
