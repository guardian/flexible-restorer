import angular from 'angular';
import mediator from '../utils/mediator';

var ErrorCtrlMod = angular.module('ErrorCtrlMod', []);

ErrorCtrlMod.controller('ErrorCtrl', [
  '$element',
  function($element){
    $element.attr('style', '');
    this.hasError     = false;
    this.errorContent = '';

    mediator.subscribe('error', (err)=> {
      //TODO JP 15/4/15 ADD CS LOGGING HERE
      this.hasError = true;
      this.errorContent = err.message;
    });
  }
]);

export default ErrorCtrlMod;
