import angular from 'angular';

var SnapshotModelMod = angular.module('SnapshotModelMod', []);

var SnapshotModel = SnapshotModelMod.service('SnapshotModel', [
  function(){

    class SnapshotModel {
      constructor(data){
        console.log('got it ->', data);
      }
    }


    return {
      getModel: (data)=> new SnapshotModel(data)
    }
  }
]);

export default SnapshotModelMod;
