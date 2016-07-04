import angular from 'angular';

var DateFormatServiceMod = angular.module('DateFormatServiceMod', []);

DateFormatServiceMod.service('DateFormatService', [
    function() {
        return {
            formatHtml: (date) => {
                var ordinal = date.format('Do').slice(-2);
                var prefix = date.format('HH:mm:ss [on] D');
                var month = date.format('MMMM');
                return `${prefix}<sup>${ordinal}</sup> ${month}`
            }
        }
    }
]);
