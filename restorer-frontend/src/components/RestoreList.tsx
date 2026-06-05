import { css } from "@emotion/react";
import React from "react";
import { SnapshotIdModel, type VersionListItem } from "../models";
import { GuIcon } from "./GuComponents";
import { styles } from "./RestoreList.styles";

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

type Props = {
    activeVersionIndex: number;
    setActiveVersionIndex: { (index: number): void };
    items?: VersionListItem[];
    articleHash?: string;
};

// Main converted component
export const RestoreList: React.FC<Props> = ({
    activeVersionIndex,
    setActiveVersionIndex,
    items = [],
    articleHash = "",
}) => {
    const models = items.map((item) => new SnapshotIdModel(item));
    const activeModel = models[activeVersionIndex];

    return (
        <div css={styles.scrollableContainer}>
            <div css={styles.scrollableHeaderFixed}>
                <h1 css={styles.articleHeadline}>
                    {activeModel?.headline ?? ""}
                </h1>
                <h6 css={styles.articleHash}>
                    (
                    <a
                        href={activeModel?.getComposerUrl() ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                    >
                        {articleHash}
                    </a>
                    )
                </h6>
                <div css={[styles.row, styles.snapshotListHeader]}>
                    <span
                        css={styles.snapshotListHeaderDecal}
                        title="Content revision number"
                    >
                        No.
                    </span>
                    <span css={styles.snapshotListHeaderContent}>
                        Snapped at &amp; last modified
                    </span>
                    <span css={styles.snapshotListHeaderStatus}>Status</span>
                </div>
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
                                              setActiveVersionIndex(index);
                                          }
                                        : undefined
                                }
                            >
                                <div css={styles.indexListItemIndex}>
                                    {model.revisionId ?? models.length - index}
                                </div>

                                <div>
                                    <h6
                                        css={
                                            styles.snapshotListItemContentActualDate
                                        }
                                        dangerouslySetInnerHTML={{
                                            __html: model.createdDateHtml ?? "",
                                        }}
                                    ></h6>
                                    <h6
                                        css={
                                            styles.snapshotListItemContentRelativeDate
                                        }
                                    >
                                        {model.getRelativeDate()} ago
                                    </h6>
                                    <h6
                                        css={
                                            styles.snapshotListItemContentReason
                                        }
                                    >
                                        Last modified by: {model.userEmail}
                                    </h6>
                                    <h6
                                        css={
                                            styles.snapshotListItemContentReason
                                        }
                                    >
                                        {model.snapshotReason}
                                    </h6>
                                </div>

                                <div css={styles.snapshotListItemInformation}>
                                    <div css={styles.snapshotListItemStatus}>
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

                                            {model.commentsEnabled?.on && (
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

                                            {model.commentsEnabled?.defined &&
                                                !model.commentsEnabled?.on && (
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
                                <div
                                    css={[
                                        styles.row,
                                        { flexDirection: "row-reverse" },
                                    ]}
                                >
                                    <GuIcon
                                        css={styles.deltaRowIcon}
                                        variant="expand-disabled"
                                    />
                                    <span css={styles.deltaRowContent}>
                                        {models[index + 1]
                                            ? models[index + 1].getRelativeDate(
                                                  model.createdDate,
                                              )
                                            : model.getRelativeDate()}
                                    </span>
                                </div>
                            </li>
                        </React.Fragment>
                    ))}
                </ol>
            </div>
        </div>
    );
};
