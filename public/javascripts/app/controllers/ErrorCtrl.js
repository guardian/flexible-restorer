import angular from 'angular';
import mediator from '../utils/mediator';

var ErrorCtrlMod = angular.module('ErrorCtrlMod', []);

ErrorCtrlMod.controller('ErrorCtrl', [
    '$element',
    '$log',
    '$timeout',
    function ($element, $log, $timeout) {
        $element.attr('style', '');
        this.hasError = false;
        this.errorContent = '';

        // `error` is published through the mediator, often from outside Angular's
        // digest, so update the flags inside `$timeout` to render the modal.
        mediator.subscribe('error', (err) => {
            $timeout(() => {
                this.hasError = true;
                this.errorContent = err.message;
            });
            $log.error(err.message);
        });
    }
]);

export default ErrorCtrlMod;
