// approximations of models/classes used in Angular

import type { VersionListItem } from "./server";
import dayjs from "dayjs";

export class SnapshotIdModel {
    private _data: VersionListItem;

    constructor(data: VersionListItem) {
        this._data = data;
    }

    get createdDateHtml() {
        const dateTime = dayjs(this._data.timestamp);
        const time = dateTime.format("HH:mm:ss");
        const date = dateTime.format("DD MMMM");
        return `${time} on ${date}`;
    }

    getSystemId() {
        return this._data.system.id;
    }

    getSystem() {
        return this._data.system;
    }

    get isSecondary() {
        return this._data.system.isSecondary;
    }

    getComposerUrl() {
        return `${this.getComposerPrefix()}/content/${this.getContentId()}`;
    }

    getComposerPrefix() {
        return this._data.system.composerPrefix;
    }

    getContentId() {
        return this._data.contentId;
    }

    get timestamp() {
        return this._data.timestamp;
    }

    get headline() {
        return this._data.info.summary.preview.fields?.headline;
    }

    get revisionId() {
        return this._data.info.summary.contentChangeDetails.revision;
    }

    get snapshotReason() {
        return this._data.info.metadata.reason;
    }

    isBecauseOfLaunch() {
        const reason = this.snapshotReason || "";
        return (
            reason === "Published" || reason.toLowerCase().includes("launch")
        );
    }

    get isLegallySensitive() {
        const legallySensitive =
            this._data.info.summary.preview.settings?.legallySensitive;
        return legallySensitive === "true";
    }

    get commentsEnabled() {
        const commentable =
            this._data.info.summary.preview.settings?.commentable;
        return {
            defined: !!commentable,
            on: commentable === "true",
        };
    }

    get publishedState() {
        const publishedDetails =
            this._data.info.summary.contentChangeDetails.published;

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

    get createdDate() {
        return dayjs(this._data.timestamp);
    }

    getRelativeDate(date = dayjs()) {
        const createdDate = this.createdDate;

        const hourDiff = date.diff(createdDate, "hours");

        if (hourDiff < 1) {
            return `${date.diff(createdDate, "minutes")} minutes`;
        }

        if (hourDiff == 1) {
            return `an hour`;
        }

        if (hourDiff < 36) {
            return `${hourDiff} hours`;
        }
        const dayDiff = date.diff(createdDate, "days");
        return `${dayDiff} days`;
    }

    get userEmail() {
        const lastModifiedUser =
            this._data.info.summary.contentChangeDetails.lastModified.user;
        if (lastModifiedUser) {
            const firstName = lastModifiedUser.firstName;
            const lastName = lastModifiedUser.lastName;
            return firstName + " " + lastName;
        }
        return undefined;
    }
}
