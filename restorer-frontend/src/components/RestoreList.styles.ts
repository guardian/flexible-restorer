import { css } from "@emotion/react";

export const styles = {
    row: css({
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
    }),
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
    `,
    snapshotListItemNotActive: css`
        cursor: pointer;
        &:hover {
            background-color: yellow;
        }
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
