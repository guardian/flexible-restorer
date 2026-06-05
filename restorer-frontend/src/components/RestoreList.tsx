import { css } from "@emotion/react";
import { Button } from "@guardian/stand/Button";
import { Layout } from "@guardian/stand/Layout";
import { LinkButton } from "@guardian/stand/LinkButton";
import Dayjs from "dayjs";
import React, { useState } from "react";
import type { VersionModel } from "../models";
import { GuColumn, GuIcon, GuRow } from "./GuComponents";

/*
initial file generated with AI:
Read the Angular template in restore-list.html and convert it to a react component, to be outputted in RestoreList.tsx. For the elements with custom names starting with "gu-", create supporting react components, for example "<gu-column>" becomes "<GuColoumn>". Infer what you can about how the supporting components should behave based on the files imported from gu-components.js

(follow up)
just split the component to a separate files, do not worry about unit tests for them

(next iteration)
In RestoreList, replace all GuBtn components with the Button from the @guardian/stand library and all link elements (<a>) with the @guardian/stand library 's Link component. Do not remove any comments this file.

(forgot to tell the AI to remove classNames - did that)


follow up:
replace all of the className attributes in RestoreList.tsx with object notation emotion css matching the the .scss files in the sass folder. define all the css objects at the start of RestoreList.tsx in an object called "styles".

*/

const styles = {
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


type Props = {
    activeVersionIndex: number;
    setActiveVersionIndex: { (index: number): void };
    models?: VersionModel[];
    articleTitle?: string;
    articleURL?: string;
    articleHash?: string;
    canRestore?: boolean;
    copyButtonLabel?: string;
    displayButtonLabel?: string;
    headline?: string;
    standfirst?: string;
    trailText?: string;
    htmlContent?: string;
    jsonContent?: string;
    contentId?: string | number;
};

// Main converted component
export const RestoreList: React.FC<Props> = ({
    activeVersionIndex,
    setActiveVersionIndex,
    models = [],
    articleTitle = "",
    articleURL = "#",
    articleHash = "",
    canRestore = false,
    copyButtonLabel = "Copy",
    displayButtonLabel = "Display JSON",
    headline = "",
    standfirst = "",
    trailText = "",
    htmlContent = "",
    jsonContent = "",
    contentId = "",
}) => {
    const [today] = useState(() => new Date().toISOString());

    const getRelativeDate = (model: VersionModel, nextModel?: VersionModel) => {
        const nextModelTime = nextModel?.createdTimestamp ?? today;
        const newModelTime = model.createdTimestamp;

        if (!newModelTime) {
            return `[no relative date]`;
        }

        const hourDiff = Dayjs(nextModelTime).diff(newModelTime, "hours");
        if (hourDiff < 36) {
            return `${hourDiff} hours ago`;
        }
        const dayDiff = Dayjs(nextModelTime).diff(newModelTime, "days");
        return `${dayDiff} days ago`;
    };

    return (
        <>
            <Layout.Sidebar>
                <div css={styles.scrollableContainer}>
                    <div css={styles.scrollableHeaderFixed}>
                        <h1 css={styles.articleHeadline}>{articleTitle}</h1>
                        <h6 css={styles.articleHash}>
                            (
                            <a
                                href={articleURL}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {articleHash}
                            </a>
                            )
                        </h6>
                        <GuRow css={styles.snapshotListHeader}>
                            <span
                                css={styles.snapshotListHeaderDecal}
                                title="Content revision number"
                            >
                                No.
                            </span>
                            <span css={styles.snapshotListHeaderContent}>
                                Snapped at &amp; last modified
                            </span>
                            <span css={styles.snapshotListHeaderStatus}>
                                Status
                            </span>
                        </GuRow>
                    </div>

                    <div css={styles.scrollableBody}>
                        <ol css={styles.snapshotList}>
                            {models.map((model, index) => (
                                <React.Fragment key={index}>
                                    {model.isSecondary && (
                                        <li css={styles.snapshotListSecondary}>
                                            Snapshot from secondary
                                        </li>
                                    )}

                                    <li
                                        css={[
                                            styles.snapshotListItem,
                                            index === activeVersionIndex &&
                                                css`
                                                    background-color: lightgray;
                                                `,
                                        ]}
                                        onClick={
                                            index !== activeVersionIndex
                                                ? () => {
                                                      setActiveVersionIndex(
                                                          index,
                                                      );
                                                  }
                                                : undefined
                                        }
                                    >
                                        <div css={styles.indexListItemIndex}>
                                            {model.revisionId ??
                                                models.length - index}
                                        </div>

                                        <div>
                                            <h6
                                                css={
                                                    styles.snapshotListItemContentActualDate
                                                }
                                                dangerouslySetInnerHTML={{
                                                    __html:
                                                        model.createdDateHtml ??
                                                        "",
                                                }}
                                            ></h6>
                                            <h6
                                                css={
                                                    styles.snapshotListItemContentRelativeDate
                                                }
                                            >
                                                {/* {model.relativeDate} ago */}
                                                {getRelativeDate(model)}
                                            </h6>
                                            <h6
                                                css={
                                                    styles.snapshotListItemContentReason
                                                }
                                            >
                                                Last modified by:{" "}
                                                {model.userEmail}
                                            </h6>
                                            <h6
                                                css={
                                                    styles.snapshotListItemContentReason
                                                }
                                            >
                                                {model.snapshotReason}
                                            </h6>
                                        </div>

                                        <div
                                            css={
                                                styles.snapshotListItemInformation
                                            }
                                        >
                                            <div
                                                css={
                                                    styles.snapshotListItemStatus
                                                }
                                            >
                                                <div
                                                    css={
                                                        styles.snapshotListItemStatusLeft
                                                    }
                                                >
                                                    {model.isLegallySensitive && (
                                                        <div
                                                            css={
                                                                styles.snapshotListItemSettingsLegallySensitive
                                                            }
                                                        />
                                                    )}

                                                    {model.commentsEnabled
                                                        ?.on && (
                                                        <div
                                                            css={
                                                                styles.snapshotListItemSettingsCommentsOn
                                                            }
                                                        >
                                                            <div
                                                                css={
                                                                    styles.snapshotListItemSettingsCommentsOnImage
                                                                }
                                                            />
                                                            <div
                                                                css={
                                                                    styles.snapshotListItemSettingsContentText
                                                                }
                                                            >
                                                                on
                                                            </div>
                                                        </div>
                                                    )}

                                                    {model.commentsEnabled
                                                        ?.defined &&
                                                        !model.commentsEnabled
                                                            ?.on && (
                                                            <div
                                                                css={
                                                                    styles.snapshotListItemSettingsCommentsOff
                                                                }
                                                            >
                                                                <div
                                                                    css={
                                                                        styles.snapshotListItemSettingsCommentsOffImage
                                                                    }
                                                                />
                                                                <div
                                                                    css={
                                                                        styles.snapshotListItemSettingsContentText
                                                                    }
                                                                >
                                                                    off
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>

                                                {model.publishedState && (
                                                    <div
                                                        css={
                                                            styles.snapshotListItemStatusRight
                                                        }
                                                    >
                                                        {model.publishedState}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </li>

                                    <li css={styles.deltaRow}>
                                        <GuRow variant="reverse">
                                            <GuIcon
                                                css={styles.deltaRowIcon}
                                                variant="expand-disabled"
                                            />
                                            <span css={styles.deltaRowContent}>
                                                {/* AI got this wrong - should be the date relative to the next item */}
                                                {/* {model.relativeDate} */}
                                                {getRelativeDate(
                                                    model,
                                                    models[index + 1],
                                                )}
                                            </span>
                                        </GuRow>
                                    </li>
                                </React.Fragment>
                            ))}
                        </ol>
                    </div>
                </div>
            </Layout.Sidebar>

            <Layout.Main>
                <div
                    css={[
                        styles.snapshotContentViewport,
                        styles.scrollableContainer,
                    ]}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        {canRestore && (
                            <Button>
                                <GuIcon
                                    css={
                                        styles.snapshotContentActionsRestoreIcon
                                    }
                                    variant="wrench-disabled"
                                />
                                <span>Restore</span>
                            </Button>
                        )}
                        <Button>{copyButtonLabel}</Button>
                        <LinkButton
                            size="sm"
                            target="_blank"
                            rel="noreferrer"
                            href={`/export/${contentId}/git`}
                        >
                            Export all as Git Repo
                        </LinkButton>
                        <LinkButton
                            size="sm"
                            target="_blank"
                            rel="noreferrer"
                            href={`/export/${contentId}/zip`}
                        >
                            Export all as Zip
                        </LinkButton>
                        <Button>{displayButtonLabel}</Button>
                    </div>

                    <div css={styles.scrollableBody}>
                        <div css={styles.snapshotContentFurniture}>
                            <GuRow css={styles.snapshotContentFurnitureItem}>
                                <h4
                                    css={
                                        styles.snapshotContentFurnitureItemHeader
                                    }
                                >
                                    Headline
                                </h4>
                                <p
                                    css={
                                        styles.snapshotContentFurnitureItemContent
                                    }
                                >
                                    {headline}
                                </p>
                            </GuRow>

                            <GuRow css={styles.snapshotContentFurnitureItem}>
                                <h4
                                    css={
                                        styles.snapshotContentFurnitureItemHeader
                                    }
                                >
                                    Standfirst
                                </h4>
                                <p
                                    css={
                                        styles.snapshotContentFurnitureItemContent
                                    }
                                >
                                    {standfirst}
                                </p>
                            </GuRow>

                            <GuRow css={styles.snapshotContentFurnitureItem}>
                                <h4
                                    css={
                                        styles.snapshotContentFurnitureItemHeader
                                    }
                                >
                                    TrailText
                                </h4>
                                <p
                                    css={
                                        styles.snapshotContentFurnitureItemContent
                                    }
                                >
                                    {trailText}
                                </p>
                            </GuRow>
                        </div>

                        <GuRow css={styles.snapshotContentContainer}>
                            <GuColumn
                                span={6}
                                css={styles.snapshotContentContainerItem}
                            >
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: htmlContent,
                                    }}
                                />
                            </GuColumn>

                            <GuColumn
                                span={6}
                                css={styles.snapshotContentContainerItemJson}
                            >
                                <pre>
                                    <code>{jsonContent}</code>
                                </pre>
                            </GuColumn>
                        </GuRow>
                    </div>
                </div>
            </Layout.Main>
        </>
    );
};
