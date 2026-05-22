import { useEffect, useState } from "react";
import SnapshotService, {
    type VersionListItem,
} from "../services/SnapshotService";
import { RestoreList, type VersionModel } from "./RestoreList";

interface Props {
    contentId: string;
}

const convertToModel = (version: VersionListItem): VersionModel => {
    return {
        activeState: false,
        isSecondary: version.system.isSecondary,
        revisionId: version.info.summary.contentChangeDetails.revision,
        createdDateHtml: "",
        relativeDate: "",
        userEmail: "",
        snapshotReason: version.info.metadata.reason,
        isLegallySensitive:
            version.info.summary.preview.settings.legallySensitive === "true",
        commentsEnabled: {
            on: undefined,
            defined: undefined,
        },
        publishedState: undefined,
        isBecauseOfLaunch: false,
    };
};

export const ContentPage = ({ contentId }: Props) => {
    const [snapshotService] = useState(new SnapshotService());
    const [modelList, setModelList] = useState<VersionModel[]>();
    const [itemList, setItemList] = useState<VersionListItem[]>();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        snapshotService.getList(contentId).then((response) => {
            setIsLoading(false);
            setItemList(response);
            const models = response.map(convertToModel);
            const [first] = models;
            if (first) {
                first.activeState = true;
            }
            setModelList(models);
        });
    }, [contentId, snapshotService]);

    const activeIndex = modelList?.findIndex((model) => model.activeState);

    // const activeModel =
    //     typeof activeIndex === "number" ? modelList?.[activeIndex] : undefined;
    const activeItem =
        typeof activeIndex === "number" ? itemList?.[activeIndex] : undefined;

    const fields = activeItem?.info.summary.preview.fields;

    const articleURL = activeItem
        ? `${activeItem?.system.composerPrefix}/content/${activeItem?.contentId}`
        : undefined;

    return (
        <>
            {/* TO DO - overlay modal component */}
            <dialog open={isLoading}>Loading...</dialog>

            <RestoreList
                models={modelList}
                articleTitle={fields?.headline}
                articleURL={articleURL}
                articleHash={contentId}
                canRestore={undefined}
                copyButtonLabel={undefined}
                displayButtonLabel={undefined}
                headline={fields?.headline}
                standfirst={fields?.standfirst}
                trailText={fields?.trailText}
                htmlContent="<p>contents</p>"
                jsonContent="[]"
                contentId={contentId}
            />
        </>
    );
};
