import angular  from 'angular';
import moment   from 'moment';
import flatten from 'flatten';
import lodash_get from 'lodash.get';
import BaseModel from 'composer-components/lib/models/BaseModel';

var SnapshotModelMod = angular.module('SnapshotModelMod', []);

SnapshotModelMod.factory('SnapshotModel', [
  function(){

    class SnapshotModel extends BaseModel{
      constructor(data){
        super();
        var timestamp = data.timestamp;
        var snapshotData = data.snapshot;
        this.data = {
          timestamp: timestamp,
          createdDate: moment(timestamp),
          activeState: false,
          snapshot: snapshotData.data,
          metadata: snapshotData.metadata
        };
      }

      getCreatedDate(){
        return this.get('createdDate').format('HH:mm:ss D MMMM YYYY');
      }

      isPublished() {
          return this.get('snapshot.published');
      }

      getPublishedState() {
          const publishedDetails = this.get('snapshot.contentChangeDetails.published');
          const published = this.get('snapshot.published');
          const settings = this.get('snapshot.preview.settings');
          const scheduledLaunchDate = this.get('snapshot.scheduledLaunchDate');

          if (!!scheduledLaunchDate) {
              const time = moment(scheduledLaunchDate);
              return "Scheduled  " + time.format("ddd D MMMM YYYY");
          }

          if (!!settings && !!settings.embargoedUntil) {
              const time = moment(settings.embargoedUntil);
              return "Embargoed until " + time.format("ddd D MMMM YYYY");
          }

          if (published) {
              return 'Published';
          }

          if (!published && !!publishedDetails) {
              return "Taken down";
          }

      }

      getHeadline() {
          return this.get("snapshot.preview.fields.headline");
      }

      getStandfirst() {
          return this.get("snapshot.preview.fields.standfirst");
      }

      getSettingsInfo() {
          const settings = this.get('snapshot.preview.settings');
          // flex stores strings not booleans so we need to convert
          // them all over
          const type = this.get('snapshot.type');
          const liveBloggingNow = (settings.liveBloggingNow === "true");
          const isLive = (type === "liveblog") && liveBloggingNow;

          const retSettings = {
              isLive: isLive,
              type: type
          };

          return retSettings;
      }

      isLegallySensitive() {
          const legallySensitive = this.get('snapshot.preview.settings.legallySensitive');
          return legallySensitive === "true";
      }

      commentsEnabled() {
          const commentable = this.get('snapshot.preview.settings.commentable');

          let ret = {
              defined: commentable,
              on: (commentable === "true")
          };

          return ret;
      }

      getRelativeDate(date = moment()){
        return this.get('createdDate').from(date, true);
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

      getHeadline(){
        return this.get('snapshot.preview.fields.headline');
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
