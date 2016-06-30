import angular  from 'angular';
import moment   from 'moment';
import lodash_get from 'lodash.get';
import BaseModel from './BaseModel';

var SnapshotIdModelMod = angular.module('SnapshotIdModelMod', []);

SnapshotIdModelMod.factory('SnapshotIdModel', [
    function(){

        class SnapshotIdModel extends BaseModel{
            constructor(data){
                super();
                // contentId: String, timestamp: String
                var system = data.system;
                var contentId = data.contentId;
                var timestamp = data.timestamp;
                var metadata = data.info.metadata;
                var summary = data.info.summary;
                this.data = {
                    system: system,
                    timestamp: timestamp,
                    contentId: contentId,
                    createdDate: moment(timestamp),
                    activeState: false,
                    metadata: metadata,
                    summary: summary
                };
            }

            getCreatedDateHtml(){
                var date = this.get('createdDate');
                var ordinal = date.format('Do').slice(-2);
                var prefix = date.format('HH:mm:ss [on] D');
                var month = date.format('MMMM');

                return `${prefix}<sup>${ordinal}</sup> ${month}`
            }

            getSystemId() {
                return this.get('system.id')
            }

            getSystem() {
                return this.get('system')
            }

            isSecondary() {
                return this.get('system.isSecondary');
            }

            getComposerUrl() {
                return `${this.getComposerPrefix()}/content/${this.getContentId()}`;
            }

            getComposerPrefix() {
                return this.get('system.composerPrefix');
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

            getRevisionId() {
                return this.get('summary.contentChangeDetails.revision')
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

                return "";
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
