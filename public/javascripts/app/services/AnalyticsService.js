import angular from 'angular';

function loadTrackingPixel(clientUrl, path) {
  const image = new Image();
  image.src = `${clientUrl}/guardian-tool-accessed?app=restorer&path=${path}`;
}

var AnalyticsServiceMod = angular.module('AnalyticsServiceMod', []);

AnalyticsServiceMod.service('AnalyticsService', [
  '$rootScope',
  '$location',
  function($rootScope, $location) {
    var userTelemetryClient;
    switch ($location.host()) {
      case "restorer.gutools.co.uk":
        userTelemetryClient = "https://user-telemetry.gutools.co.uk";
        break;
      case "restorer.code.dev-gutools.co.uk":
        userTelemetryClient = "https://user-telemetry.code.dev-gutools.co.uk";
        break;
      default:
        userTelemetryClient = "https://user-telemetry.local.dev-gutools.co.uk";
        break;
    }

    $rootScope.$on('$routeChangeSuccess', function() {
      loadTrackingPixel(userTelemetryClient, $location.path());
    });
  }
]);

export default AnalyticsServiceMod;
