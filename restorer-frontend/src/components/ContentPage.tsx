import { useEffect, useState } from "react";
import {
    type VersionListItem
} from "../models";
import SnapshotService from "../services/SnapshotService";
import { RestoreList } from "./RestoreList";

interface Props {
    contentId: string;
}

export const ContentPage = ({ contentId }: Props) => {
    const [snapshotService] = useState(new SnapshotService());
    const [itemList, setItemList] = useState<VersionListItem[]>();
    const [isLoading, setIsLoading] = useState(true);
    const [activeVersionIndex, setActiveVersionIndex] = useState(0);

    useEffect(() => {
        snapshotService.getList(contentId).then((versions) => {
            setIsLoading(false);
            versions.reverse();
            setItemList(versions);
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
                items={itemList}
                articleURL={articleURL}
                articleHash={contentId}
                canRestore={undefined}
                copyButtonLabel={undefined}
                displayButtonLabel={undefined}
                contentId={contentId}
                articleTitle={fields?.headline}
                headline={fields?.headline}
                standfirst={fields?.standfirst}
                trailText={fields?.trailText}
                htmlContent="<p>contents</p>"
                jsonContent="[]"
            />
        </>
    );
};
