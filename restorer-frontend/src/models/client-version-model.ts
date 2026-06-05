// approximations of models/classes used in Angular

import type { VersionListItem } from "./server";
import dayjs from "dayjs";

export type VersionModel = {
    isSecondary?: boolean;
    revisionId?: number | string;
    createdDateHtml?: string;
    createdTimestamp?: string;
    relativeDate?: string;
    userEmail?: string;
    snapshotReason?: string;
    isLegallySensitive?: boolean;
    commentsEnabled?: { on?: boolean; defined?: boolean };
    publishedState?: string;
    isBecauseOfLaunch?: boolean;
};

export const convertToModel = (version: VersionListItem): VersionModel => {
    return {
        isSecondary: version.system.isSecondary,
        revisionId: version.info.summary.contentChangeDetails.revision,
        createdDateHtml: "",
        createdTimestamp: version.timestamp,
        relativeDate: "[no relative date]",
        userEmail: "",
        snapshotReason: version.info.metadata.reason,
        isLegallySensitive:
            version.info.summary.preview.settings.legallySensitive === "true",
        commentsEnabled: {
            on: undefined,
            defined: undefined,
        },
        publishedState: undefined, // TO DO - parse from model
        isBecauseOfLaunch: false,
    };
};

export class SnapshotIdModel {

    private _data:VersionListItem

    constructor(data:VersionListItem) {
        
        this._data = data


    }

    getCreatedDateHtml() {
        const date = dayjs(this._data.timestamp)
        return date.format(); // TO DO - compare to date format service in Angular
    }

    getSystemId() {
        return this._data.system.id;
    }

    getSystem() {
        return this._data.system;
    }

    isSecondary() {
        return this._data.system.isSecondary
    }

    getComposerUrl() {
        return `${this.getComposerPrefix()}/content/${this.getContentId()}`;
    }

    getComposerPrefix() {
       return this._data.system.composerPrefix
    }

    getContentId() {
       return this._data.contentId
    }

    getTimestamp() {
        return this._data.timestamp
    }

    getHeadline() {
        return this._data.info.summary.preview.fields.headline
    }

    getRevisionId() {
        return this._data.info.summary.contentChangeDetails.revision;
    }

    getSnapshotReason() {
        return this._data.info.metadata.reason
    }

    isBecauseOfLaunch() {
        const reason = this.getSnapshotReason() || "";
        return (
            reason === "Published" || reason.toLowerCase().includes("launch")
        );
    }

    isLegallySensitive() {
        const legallySensitive = this._data.info.summary.preview.settings.legallySensitive;
        return legallySensitive === "true";
    }

    commentsEnabled() {
        const commentable = this._data.info.summary.preview.settings.commentable;;
        return {
            defined: !!commentable,
            on: commentable === "true",
        };
    }

    getPublishedState() {

        const publishedDetails = this._data.info.summary.contentChangeDetails.published

        const published = this._data.info.summary.published;
        const settings = this._data.info.summary.preview.settings;
        const scheduledLaunchDate = this._data.info.summary.scheduledLaunchDate;

        if (scheduledLaunchDate) {
            const time = dayjs(scheduledLaunchDate);
            return "Scheduled  " + time.format("ddd D MMMM YYYY");
        }

        if (!!settings && !!settings.embargoedUntil) {
            const time = dayjs(settings.embargoedUntil);
            return "Embargoed until " + time.format("ddd D MMMM YYYY");
        }

        if (published) {
            return "Published";
        }

        if (!published && !!publishedDetails) {
            return "Taken down";
        }

        return undefined;
    }

    getRelativeDate(date = dayjs()) {
        const createdDate = dayjs(this._data.timestamp)
        return createdDate.diff(date, 'days')
    }

    getUserEmail() {
        const lastModifiedUser = this._data.info.summary.contentChangeDetails.lastModified.user
        if (lastModifiedUser) {
            const firstName = lastModifiedUser.firstName;
            const lastName = lastModifiedUser.lastName;
            return firstName + " " + lastName;
        }
        return undefined;
    }
}
