import angular from 'angular';
import mediator from '../utils/mediator';

var ErrorCtrlMod = angular.module('ErrorCtrlMod', []);

ErrorCtrlMod.controller('ErrorCtrl', [
    '$element',
    '$log',
    function ($element, $log) {
        $element.attr('style', '');
        this.hasError = false;
        this.errorContent = '';

        mediator.subscribe('error', (err) => {
            this.hasError = true;
            this.errorContent = err.message;
            $log.error(err.message);
        });
    }
]);

export default ErrorCtrlMod;
