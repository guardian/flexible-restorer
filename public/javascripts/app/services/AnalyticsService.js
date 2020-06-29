import angular from 'angular';
import mediator from '../utils/mediator';

const initGA = gaId => {
    // tracking script should be on the page already
    if (gaId) {
        window.ga =
            window.ga ||
            ((...args) => (window.ga.q = window.ga.q || []).push(args));

        const { ga } = window;
        ga("create", gaId, "auto");
        ga("set", "transport", "beacon");
        ga("send", "pageview");

        return ga;
    }
    return (...args) => window.debugGA && console.log(...args);
};

var AnalyticsServiceMod = angular.module('AnalyticsServiceMod', []);

AnalyticsServiceMod.service('AnalyticsService', [
  '$q',
  function($q){

    //setup ga
    const gaId = JSON.parse(document.getElementById('config').textContent).gaId;

    const ga = initGA(gaId);

    mediator.subscribe('track:event', (event, category, action, label, value, dimensions) => {
        ga('send', 'event', category, action, label, value, dimensions);
    });
  }
]);

export default AnalyticsServiceMod;
