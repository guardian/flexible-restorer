import angular  from 'angular';
import moment   from 'moment';
import flatten from 'flatten';

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

      getHTMLContent(){
        var content = this.get('preview').blocks.map((block) => block.elements);
        content = flatten(content);
        return content.map((element) => element.fields.text || element.fields.html).join('');
      }
    }


    return {
      getModel: (data)=> new SnapshotModel(data)
    }
  }
]);

export default SnapshotModelMod;
