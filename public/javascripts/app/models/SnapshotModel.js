import angular  from 'angular';
import moment   from 'moment';
import flatten from 'flatten';
import BaseModel from 'composer-components/lib/models/BaseModel';

var SnapshotModelMod = angular.module('SnapshotModelMod', []);

SnapshotModelMod.factory('SnapshotModel', [
  function(){

    class SnapshotModel extends BaseModel{
      constructor(data){
        super();
        var timestamp = Object.keys(data)[0];
        var snapshotData = data[timestamp];
        this.data = angular.extend({}, {
          timestamp: timestamp,
          createdDate: moment(timestamp),
          activeState: false
        }, snapshotData);
      }

      getCreatedDate(){
        return this.get('createdDate').format('HH:mm:ss D MMMM YYYY');
      }

      getRelativeDate(date = moment()){
        return this.get('createdDate').from(date, true);
      }

      getHTMLContent(){
        var content = this.get('preview').blocks.map((block) => block.elements);
        content = flatten(content);
        return content.map((element) => {
          if (element.fields.text) {
            return element.fields.text;
          }
          if (element.fields.html) {
            return element.fields.html;
          }
        }).join('');
      }

      getHeadline(){
        return this.get('preview').fields.headline;
      }

      //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON_behavior
      toJSON(){
        var clone = angular.extend({}, this.data);
        //clear decorated data
        delete clone.timestamp;
        delete clone.createdDate;
        delete clone.activeState;
        return clone;
      }

      getJSON(){
        return JSON.stringify(this, null, 2);
      }
    }


    return {
      getModel: (data)=> new SnapshotModel(data)
    }
  }
]);

export default SnapshotModelMod;
