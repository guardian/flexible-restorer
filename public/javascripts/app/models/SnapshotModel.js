import angular  from 'angular';
import moment   from 'moment';

var SnapshotModelMod = angular.module('SnapshotModelMod', []);

var SnapshotModel = SnapshotModelMod.factory('SnapshotModel', [
  function(){

    class SnapshotModel {
      constructor(data){
        var timestamp = Object.keys(data)[0];
        var snapshotData = data[timestamp];
        this.data = angular.extend({}, {
          timestamp: timestamp,
          createdDate: moment(timestamp),
          activeState: false
        }, snapshotData);
      }

      get(key){
        return this.data[key];
      }

      set(key, val) {
        this.data[key] = val;
      }

      getCreatedDate(){
        return this.get('createdDate').format('h:mm:ss D MMMM YYYY');
      }

      getRelativeDate(date = moment()){
        return this.get('createdDate').from(date, true);
      }
    }


    return {
      getModel: (data)=> new SnapshotModel(data)
    }
  }
]);

export default SnapshotModelMod;
