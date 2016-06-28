import angular  from 'angular';
import moment   from 'moment';
import flatten from 'flatten';
import lodash_get from 'lodash.get';
import BaseModel from './BaseModel';

var SnapshotModelMod = angular.module('SnapshotModelMod', []);

SnapshotModelMod.factory('SnapshotModel', [
  function(){

    class SnapshotModel extends BaseModel{
      constructor(timestamp, snapshotData){
        super();
        this.data = {
          timestamp: timestamp,
          createdDate: moment(timestamp),
          activeState: false,
          snapshot: snapshotData
        };
      }

      getCreatedDate(){
        return this.get('createdDate').format('HH:mm:ss D MMMM YYYY');
      }

      getHeadline() {
          return this.get("snapshot.preview.fields.headline");
      }

      getStandfirst() {
          return this.get("snapshot.preview.fields.standfirst");
      }

      getHTMLContent(){
        var content = this.get('snapshot.preview').blocks.map((block) => block.elements);
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

      get(key){
          return lodash_get(this.data, key);
      }

      //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON_behavior
      toJSON(){
        var clone = angular.extend({}, this.data);
        //clear decorated data
        delete clone.timestamp;
        delete clone.createdDate;
        delete clone.activeState;
        delete clone.snapshot;
        return clone;
      }

      getJSON(){
        return JSON.stringify(this, null, 2);
      }
    }


    return {
      getModel: (timestamp, data)=> new SnapshotModel(timestamp, data)
    };
  }
]);

export default SnapshotModelMod;
