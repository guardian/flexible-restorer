import { css } from "@emotion/react";
import type { SnapshotIdModel } from "../models";
import { styles } from "./RestoreList.styles";
import { Grid, Item } from "@guardian/stand/Grid";
import { Icon } from "@guardian/stand/Icon";

export const RestoreItem = ({
    model,
    nextModel,
    isActive,
    makeActive,
    itemNumber,
}: {
    model: SnapshotIdModel;
    nextModel?: SnapshotIdModel;
    isActive: boolean;
    makeActive: { (): void };
    itemNumber: number;
}) => {
    return (
        <li>
            {model.isSecondary && (
                <div css={styles.snapshotListSecondary}>
                    Snapshot from secondary
                </div>
            )}
            <div
                css={[
                    styles.snapshotListItem,
                    isActive
                        ? css`
                              background-color: lightgray;
                          `
                        : styles.snapshotListItemNotActive,
                ]}
                onClick={!isActive ? makeActive : undefined}
            >
                <Grid
                    theme={{
                        sm: { padding: "0" },
                        md: { padding: "0" },
                        lg: { padding: "0" },
                    }}
                >
                    <Item size={2}>{itemNumber}</Item>
                    <Item size={7}>
                        <div
                            dangerouslySetInnerHTML={{
                                __html: model.createdDateHtml ?? "",
                            }}
                        ></div>
                        <div>{model.getRelativeDate()} ago</div>
                        <div>Last modified by: {model.userEmail}</div>
                        <div>{model.snapshotReason}</div>
                    </Item>
                    <Item size={3}>
                        <div>
                            <div>
                                {model.isLegallySensitive && <div />}

                                {model.commentsEnabled?.on && (
                                    <div>
                                        <div>on</div>
                                    </div>
                                )}

                                {model.commentsEnabled?.defined &&
                                    !model.commentsEnabled?.on && (
                                        <div>off</div>
                                    )}
                            </div>

                            {model.publishedState && (
                                <div>{model.publishedState}</div>
                            )}
                        </div>
                    </Item>
                </Grid>
            </div>
            <div css={styles.deltaRow}>
                <div css={[styles.row, { flexDirection: "row-reverse" }]}>
                    <Icon symbol="collapse_all" />
                    <span css={styles.deltaRowContent}>
                        {nextModel
                            ? nextModel.getRelativeDate(model.createdDate)
                            : model.getRelativeDate()}
                    </span>
                </div>
            </div>
        </li>
    );
};
