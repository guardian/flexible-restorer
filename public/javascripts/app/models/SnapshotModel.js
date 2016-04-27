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

      isPublished() {
          return this.get('published');
      }

      getPublishedState() {
          const changeDetails = this.get('contentChangeDetails');
          const publishedDetails = changeDetails.published;
          const published = this.get('published');
          const settings = this.get('preview').settings;

          const lastMajorRevisionPublished = changeDetails.lastMajorRevisionPublished;


          if (!!settings && !!settings.embargoedUntil) {
              const time = moment(settings.embargoedUntil);
              return "Embargoed until " + time.format("ddd D MMMM YYYY");
          }

          if (published && (publishedDetails.date === lastMajorRevisionPublished.date)) {
              return 'Published';
          }

          if (!published && !!publishedDetails) {
              return "Taken down";
          }

      }

      getSettingsInfo() {
          const settings = this.get('preview').settings;
          // flex stores strings not booleans so we need to convert
          // them all over
          const commentable = (settings.commentable === "true");
          const legallySensitive = (settings.legallySensitive === "false");
          const type = this.get('type');
          const liveBloggingNow = (settings.liveBloggingNow === "true");
          const isLive = (type === "liveblog") && liveBloggingNow;

          const settings = {
              commentable: commentable,
              legallySensitive: legallySensitive,
              isLive: isLive,
              type: type:
          };

          return settings;
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
