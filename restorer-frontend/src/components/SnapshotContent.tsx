import { Button } from "@guardian/stand/Button";
import { LinkButton } from "@guardian/stand/LinkButton";
import React from "react";
import type { VersionListItem } from "../models";
import { GuColumn, GuIcon, GuRow } from "./GuComponents";
import { styles } from "./RestoreList.styles";
import type { SnapshotResponse } from "../services/SnapshotService";

type SnapshotContentProps = {
    activeItem?: VersionListItem;
    canRestore: boolean;
    copyButtonLabel: string;
    displayButtonLabel: string;
    contentId: string | number;
    htmlContent: string;
    jsonContent: string;
    snapshotResponse?: SnapshotResponse;
};

export const SnapshotContent: React.FC<SnapshotContentProps> = ({
    activeItem,
    canRestore,
    copyButtonLabel,
    displayButtonLabel,
    contentId,
    htmlContent,
    jsonContent,
    snapshotResponse
}) => {
    const headline = activeItem?.info.summary.preview.fields?.headline ?? "";
    const standfirst = activeItem?.info.summary.preview.fields?.standfirst ?? "";
    const trailText = activeItem?.info.summary.preview.fields?.trailText ?? "";    

    return (
        <div css={[styles.snapshotContentViewport, styles.scrollableContainer]}>
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
                            css={styles.snapshotContentActionsRestoreIcon}
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
                        <h4 css={styles.snapshotContentFurnitureItemHeader}>
                            Headline
                        </h4>
                        <p css={styles.snapshotContentFurnitureItemContent}>
                            {headline}
                        </p>
                    </GuRow>

                    <GuRow css={styles.snapshotContentFurnitureItem}>
                        <h4 css={styles.snapshotContentFurnitureItemHeader}>
                            Standfirst
                        </h4>
                        <p css={styles.snapshotContentFurnitureItemContent}>
                            {standfirst}
                        </p>
                    </GuRow>

                    <GuRow css={styles.snapshotContentFurnitureItem}>
                        <h4 css={styles.snapshotContentFurnitureItemHeader}>
                            TrailText
                        </h4>
                        <p css={styles.snapshotContentFurnitureItemContent}>
                            {trailText}
                        </p>
                    </GuRow>
                </div>

                <GuRow css={styles.snapshotContentContainer}>


            <aside>
                <div>
                    {snapshotResponse && (
                        <pre> {JSON.stringify(snapshotResponse,undefined,1)}</pre>
                    )}
                </div>
            </aside>

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
    );
};
