import { css } from "@emotion/react";

export const styles = {
    scrollableContainer: css`
        display: flex;
        flex-direction: column;
        max-height: 100%;
    `,
    scrollableHeaderFixed: css`
        flex-shrink: 0;
    `,
    scrollableBody: css`
        flex-grow: 1;
        overflow-y: auto;
    `,
    articleHeadline: css``,
    articleHash: css``,
    snapshotListHeader: css`
        background: #dee2e3;
        font-size: 12px;
    `,
    snapshotListHeaderDecal: css`
        box-sizing: border-box;
        flex-basis: 46px;
        max-width: 46px;
        padding: 5px 10px;
        border-right: 1px solid #bdbdbd;
    `,
    snapshotListHeaderContent: css`
        padding: 5px 10px;
        flex-basis: 175px;
        border-right: 1px solid #bdbdbd;
    `,
    snapshotListHeaderStatus: css`
        padding: 5px 10px;
    `,
    indexList: css`
        margin-top: 5px;
        list-style: none;
        padding-left: 0;
        li {
            list-style: none;
        }
    `,
    snapshotList: css`
        margin-top: 5px;
        list-style: none;
        padding: 0;
        li {
            list-style: none;
        }
    `,
    snapshotListSecondary: css`
        color: white;
        background: #ed5935;
        padding: 2px;
    `,
    snapshotListItem: css`
        position: relative;
        overflow: hidden;
        min-height: 60px;
        border-top: 1px solid black;
        border-bottom: 1px solid black;
        display: flex;
        background-color: whitesmoke;

        &.active {
            overflow: visible;
            background-color: lightgray;

            &:before {
                display: none;
            }
        }

        &:hover:not(.active) {
            color: white;
        }

        &:hover:before {
            opacity: 1;
        }

        &:before {
            content: " ";
            display: inline-block;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #898984;
            opacity: 0;
            transition:
                transform 0.2s ease-in-out,
                opacity 0.2s ease-in;
            z-index: 1;
        }
    `,
    indexListItemIndex: css`
        box-sizing: border-box;
        flex-basis: 46px;
        max-width: 46px;
        padding: 5px;
        padding-top: 10px;
        text-align: center;
        border-right: 2px solid #bdbdbd;
        z-index: 2;
    `,
    snapshotListItemContentActualDate: css``,
    snapshotListItemContentRelativeDate: css``,
    snapshotListItemContentReason: css``,
    snapshotListItemInformation: css``,
    snapshotListItemStatus: css`
        flex-grow: 3;
        font-size: small;
        font-family: "Guardian Agate Sans";
        z-index: 2;

        &:hover {
            cursor: pointer;
        }
    `,
    snapshotListItemStatusLeft: css`
        float: left;
        height: 3.1em;
        padding: 10px 5px;
    `,
    snapshotListItemStatusRight: css`
        float: right;
        width: 45%;
        height: 3.1em;
        padding: 10px 5px;
        border-left: 1px solid #bdbdbd;
    `,
    snapshotListItemSettingsLegallySensitive: css`
        padding: 0;
        text-align: center;
        height: 15px;
        margin-bottom: 5px;
        width: 17px;
        background: url(../images/legalcheck-grey-14.svg) center center
            no-repeat;
    `,
    snapshotListItemSettingsCommentsOn: css`
        width: 32px;
    `,
    snapshotListItemSettingsCommentsOnImage: css`
        padding: 0;
        float: left;
        text-align: center;
        height: 15px;
        width: 16px;
        background: url(../images/comment-green-14.svg) center center no-repeat;
    `,
    snapshotListItemSettingsContentText: css`
        float: right;
        font-size: 12px;
        text-transform: uppercase;
    `,
    snapshotListItemSettingsCommentsOff: css`
        width: 36px;
    `,
    snapshotListItemSettingsCommentsOffImage: css`
        padding: 0;
        float: left;
        text-align: center;
        height: 15px;
        width: 16px;
        background: url(../images/comment-grey-14.svg) center center no-repeat;
    `,
    deltaRow: css`
        padding: 5px 0 2px 0;
        opacity: 0.3;
    `,
    deltaRowIcon: css``,
    deltaRowContent: css``,
    snapshotContentViewport: css`
        width: 100%;
        display: flex;
        flex-flow: column;
        max-height: calc(100vh - 46px);
        overflow: scroll;
    `,
    snapshotContentActionsRestoreIcon: css`
        margin-right: 5px;
    `,
    snapshotContentFurniture: css`
        border-bottom: 1px solid rgba(162, 160, 160, 0.49);
    `,
    snapshotContentFurnitureItem: css`
        padding: 2%;
    `,
    snapshotContentFurnitureItemHeader: css`
        font-family: "Guardian Agate Sans";
        font-weight: bold;
        color: #333333;
    `,
    snapshotContentFurnitureItemContent: css`
        font-family: "Guardian Agate Sans";
        font-weight: normal;
        color: #333333;
    `,
    snapshotContentContainer: css`
        width: 200%;
        transition: transform 0.3s ease-in-out;
        transform: translateX(0);

        &.show-json {
            transform: translateX(-50%);
        }

        flex-grow: 1;
    `,
    snapshotContentContainerItem: css`
        box-sizing: border-box;
        padding: 2% 10%;
        font-family: "Guardian Agate Sans";
        overflow: auto;
    `,
    snapshotContentContainerItemJson: css`
        box-sizing: border-box;
        padding: 2% 5%;
        font-family: "Guardian Agate Sans";
        overflow: auto;
        width: 50%;

        code {
            word-wrap: break-word;
        }
    `,
};