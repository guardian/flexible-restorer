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

      getListItemContent(item, htmlFromElements) {
          const title = item.title ? `<h2>${item.title}</h2>` : "";
          const bio = item.bio ? `${item.bio}` : "";
          const endNote = item.endNote ? `<p><em>${item.endNote}</em></p>` : "";
          const byline = item.byline ? `<p>${byline}</p>` : "";
          return `${title} ${byline} ${bio} ${htmlFromElements(item.content)} ${endNote}`
      }

      getTimelineEventContent(event, htmlFromElements){
          const title = event.title ? `<h2>${event.title}</h2>` : "";
          const date = event.date ? `<p>${event.date}</p>` : "";
          return `${title} ${date} ${htmlFromElements(event.body)}`
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
                    // This element is a List element (Key takeaways, Q&A Explainer, Mini profiles)
                    return element.fields.items.map((item) => {
                        return getListItemContent(item, htmlFromElements)
                    }).join('');
                }
                if (element.fields.sections) {
                    // This element is a Timeline element
                    return element.fields.sections.map((section) => {
                        return `${section.title} ${section.events.map(event => getTimelineEventContent(body)).join('')}`
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
