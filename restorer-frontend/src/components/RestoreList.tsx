import { Grid, Item } from "@guardian/stand/Grid";
import React from "react";
import { SnapshotIdModel, type VersionListItem } from "../models";
import { RestoreItem } from "./RestoreItem";
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

                <Grid
                    theme={{
                        sm: { padding: "0" },
                        md: { padding: "0" },
                        lg: { padding: "0" },
                    }}
                >
                    <Item size={2}>No.</Item>
                    <Item size={7}>Snapped at &amp; last modified</Item>
                    <Item size={3}>Status</Item>
                </Grid>
            </div>

            <div css={styles.scrollableBody}>
                <ol css={styles.snapshotList}>
                    {models.map((model, index) => (
                        <RestoreItem
                            key={index}
                            model={model}
                            nextModel={models[index + 1]}
                            makeActive={() => setActiveVersionIndex(index)}
                            isActive={index === activeVersionIndex}
                            itemNumber={
                                model.revisionId ?? models.length - index
                            }
                        />
                    ))}
                </ol>
            </div>
        </div>
    );
};
