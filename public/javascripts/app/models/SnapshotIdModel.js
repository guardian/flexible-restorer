import angular  from 'angular';
import moment   from 'moment';
import lodash_get from 'lodash.get';
import BaseModel from 'composer-components/lib/models/BaseModel';

var SnapshotIdModelMod = angular.module('SnapshotIdModelMod', []);

SnapshotIdModelMod.factory('SnapshotIdModel', [
    function(){

        class SnapshotIdModel extends BaseModel{
            constructor(data){
                super();
                // contentId: String, timestamp: String
                var contentId = data.contentId;
                var timestamp = data.timestamp;
                var metadata = data.metadata;
                var summary = data.summary;
                this.data = {
                    timestamp: timestamp,
                    contentId: contentId,
                    createdDate: moment(timestamp),
                    activeState: false,
                    metadata: metadata,
                    summary: summary
                };
            }

            getCreatedDate(){
                return this.get('createdDate').format('HH:mm:ss D MMMM YYYY');
            }

            getContentId() {
                return this.get('contentId')
            }

            getTimestamp() {
                return this.get('timestamp')
            }

            getHeadline() {
                return this.get('summary.preview.fields.headline')
            }

            getSnapshotReason() {
                return this.get('metadata.reason')
            }

            isLegallySensitive() {
                const legallySensitive = this.get('summary.preview.settings.legallySensitive');
                return legallySensitive === "true";
            }

            commentsEnabled() {
                const commentable = this.get('summary.preview.settings.commentable');

                let ret = {
                    defined: commentable,
                    on: (commentable === "true")
                };

                return ret;
            }

            getPublishedState() {
                const publishedDetails = this.get('summary.contentChangeDetails.published');
                const published = this.get('summary.published');
                const settings = this.get('summary.preview.settings');
                const scheduledLaunchDate = this.get('summary.scheduledLaunchDate');

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

            getRelativeDate(date = moment()){
                return this.get('createdDate').from(date, true);
            }

            get(key){
                return lodash_get(this.data, key);
            }
        }


        return {
            getModel: (data)=> new SnapshotIdModel(data)
        }
    }
]);

export default SnapshotIdModelMod;
