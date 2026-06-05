import { Button } from "@guardian/stand/Button";
import { LinkButton } from "@guardian/stand/LinkButton";
import React, { type ReactNode } from "react";
import {
    SnapshotIdModel,
    type SnapshotData,
    type VersionListItem,
    type ComposerElement,
} from "../models";
import { GuColumn, GuIcon, GuRow } from "./GuComponents";
import { styles } from "./RestoreList.styles";

type SnapshotContentProps = {
    activeItem?: VersionListItem;
    canRestore: boolean;
    copyButtonLabel: string;
    displayButtonLabel: string;
    contentId: string | number;
    snapshot?: SnapshotData;
};

const renderComposerElement = (element: ComposerElement): ReactNode => {
    const { text, html } = element.fields;
    if (typeof text === "string") {
        return <div dangerouslySetInnerHTML={{ __html: text }}></div>;
    }
    if (typeof html === "string") {
        return <div dangerouslySetInnerHTML={{ __html: html }}></div>;
    }
    // TO DO - return list elements from element.fields.items or element.fields.sections
    return <p>{element.elementType} element</p>;
};

const getHtmlContent = (snapshot?: SnapshotData): ReactNode => {
    if (!snapshot?.preview) {
        return <div>No html</div>;
    }
    const elements = snapshot.preview.blocks.flatMap((block) => block.elements);
    return (
        <div>
            {elements.map((element, index) => (
                <div key={index}>{renderComposerElement(element)}</div>
            ))}
        </div>
    );
};

export const SnapshotContent: React.FC<SnapshotContentProps> = ({
    activeItem,
    canRestore,
    copyButtonLabel,
    displayButtonLabel,
    contentId,
    snapshot,
}) => {
    const model = activeItem && new SnapshotIdModel(activeItem);
    const { headline, standfirst, trailText } = model?.fields ?? {};

    const htmlContent = getHtmlContent(snapshot);

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
                    <GuColumn
                        span={6}
                        css={styles.snapshotContentContainerItem}
                    >
                        {htmlContent}
                    </GuColumn>

                    <GuColumn
                        span={6}
                        css={styles.snapshotContentContainerItemJson}
                    >
                        <div>
                            {snapshot && (
                                <pre>
                                    <code>
                                        {JSON.stringify(snapshot, undefined, 1)}
                                    </code>
                                </pre>
                            )}
                        </div>
                    </GuColumn>
                </GuRow>
            </div>
        </div>
    );
};
