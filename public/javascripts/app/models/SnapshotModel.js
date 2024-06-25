import angular  from 'angular';
import moment   from 'moment';
import flatten from 'flatten';
import lodash_get from 'lodash.get';
import BaseModel from './BaseModel';

var SnapshotModelMod = angular.module('SnapshotModelMod', []);

SnapshotModelMod.factory('SnapshotModel', [
  function(){

    class SnapshotModel extends BaseModel{
      constructor(systemId, timestamp, snapshotData){
        super();
        this.data = {
          systemId: systemId,
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

      getTrailText() {
          return this.get("snapshot.preview.fields.trailText");
      }

      getHTMLContent(){
        var content = this.get('snapshot.preview').blocks.map((block) => block.elements);
        content = flatten(content);
        function htmlFromElements(elements) {
            return elements.map((element) => {
                if (element.fields.text) {
                    return element.fields.text;
                }
                if (element.fields.html) {
                    return element.fields.html;
                }
                if (element.fields.items) {
                    return element.fields.items.map((item) => {
                        return `<h2>${item.title}</h2>` + htmlFromElements(item.content)
                    }).join('');
                }
            }).join('');
        }
        return htmlFromElements(content);
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
        delete clone.systemId;
        return clone;
      }

      getJSON(){
        return JSON.stringify(this.get('snapshot'), null, 2);
      }
    }


    return {
      getModel: (systemId, timestamp, data) => new SnapshotModel(systemId, timestamp, data)
    };
  }
]);

export default SnapshotModelMod;
