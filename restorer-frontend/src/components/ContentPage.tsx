import { useEffect, useState } from "react";
import {
    convertToModel,
    type VersionListItem,
    type VersionModel,
} from "../models";
import SnapshotService from "../services/SnapshotService";
import { RestoreList } from "./RestoreList";

interface Props {
    contentId: string;
}

export const ContentPage = ({ contentId }: Props) => {
    const [snapshotService] = useState(new SnapshotService());
    const [modelList, setModelList] = useState<VersionModel[]>();
    const [itemList, setItemList] = useState<VersionListItem[]>();
    const [isLoading, setIsLoading] = useState(true);
    const [activeVersionIndex, setActiveVersionIndex] = useState(0);

    useEffect(() => {
        snapshotService.getList(contentId).then((versions) => {
            setIsLoading(false);
            versions.reverse();
            setItemList(versions);
            const models = versions.map(convertToModel);
            setModelList(models);
        });
    }, [contentId, snapshotService]);

    const activeItem = itemList?.[activeVersionIndex];
    const fields = activeItem?.info.summary.preview.fields;

    const articleURL = activeItem
        ? `${activeItem?.system.composerPrefix}/content/${activeItem?.contentId}`
        : undefined;

    return (
        <>
            {/* TO DO - overlay modal component */}
            <dialog open={isLoading}>Loading...</dialog>

            <RestoreList
                activeVersionIndex={activeVersionIndex}
                setActiveVersionIndex={setActiveVersionIndex}
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
