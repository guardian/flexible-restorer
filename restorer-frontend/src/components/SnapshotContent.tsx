import { Button } from "@guardian/stand/Button";
import { LinkButton } from "@guardian/stand/LinkButton";
import React, { useState, type ReactNode } from "react";
import { type ComposerElement, type SnapshotData } from "../models";
import { styles } from "./RestoreList.styles";

type SnapshotContentProps = {
    canRestore: boolean;
    copyButtonLabel: string;
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

const FurnitureRow = ({
    property,
    value = "",
}: {
    property: string;
    value?: string;
}) => (
    <div
        css={[
            styles.row,
            {
                padding: "2%",
            },
        ]}
    >
        <h4 css={styles.snapshotContentFurnitureItemHeader}>{property}</h4>
        <p css={styles.snapshotContentFurnitureItemContent}>{value}</p>
    </div>
);

export const SnapshotContent: React.FC<SnapshotContentProps> = ({
    canRestore,
    copyButtonLabel,
    contentId,
    snapshot,
}) => {
    const [showJson, setShowJson] = useState(false);

    const { headline, standfirst, trailText } = snapshot?.preview?.fields ?? {};
    const htmlContent = getHtmlContent(snapshot);

    return (
        <div css={[styles.snapshotContentViewport, styles.scrollableContainer]}>
            <div
                css={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 10,
                }}
            >
                {canRestore && (
                    <Button icon="build">
                        <span>Restore</span>
                    </Button>
                )}
                <Button icon="content_copy">{copyButtonLabel}</Button>
                <LinkButton
                    icon="archive"
                    size="sm"
                    target="_blank"
                    rel="noreferrer"
                    href={`/export/${contentId}/git`}
                >
                    Export all as Git Repo
                </LinkButton>
                <LinkButton
                    icon="folder_zip"
                    size="sm"
                    target="_blank"
                    rel="noreferrer"
                    href={`/export/${contentId}/zip`}
                >
                    Export all as Zip
                </LinkButton>
                <Button onClick={() => setShowJson((current) => !current)}>
                    {showJson ? "Show Text" : "Show Json"}
                </Button>
            </div>

            <div css={styles.scrollableBody}>
                <div css={styles.snapshotContentFurniture}>
                    <FurnitureRow property="Headline" value={headline} />
                    <FurnitureRow property="Standfirst" value={standfirst} />
                    <FurnitureRow property="TrailText" value={trailText} />
                </div>
                <div css={{ paddingLeft: 10 }}>
                    {showJson ? (
                        <div>
                            {snapshot && (
                                <pre>
                                    <code>
                                        {JSON.stringify(snapshot, undefined, 1)}
                                    </code>
                                </pre>
                            )}
                        </div>
                    ) : (
                        <div>{htmlContent}</div>
                    )}
                </div>
            </div>
        </div>
    );
};
