import angular from 'angular';

var SearchFormCtrlMod = angular.module('SearchFormCtrlMod', []);

SearchFormCtrlMod.controller('SearchFormCtrl', [
  '$scope',
  '$location',
  function($scope, $location){
    this.formSubmit = (result) => {
      var hash = result.query.split('/').splice(-1)[0];
      var url = `/content/${hash}/versions`;
      $location.url(url);
    };
  }
]);

export default SearchFormCtrlMod;
