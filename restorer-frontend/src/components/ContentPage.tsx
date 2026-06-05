import { useEffect, useState } from "react";
import { type VersionListItem } from "../models";
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

    return (
        <>
            {/* TO DO - overlay modal component */}
            <dialog open={isLoading}>Loading...</dialog>

            <RestoreList
                activeVersionIndex={activeVersionIndex}
                setActiveVersionIndex={setActiveVersionIndex}
                items={itemList}
                articleHash={contentId}
                canRestore={undefined}
                copyButtonLabel={undefined}
                displayButtonLabel={undefined}
                contentId={contentId}
                htmlContent="<p>contents</p>"
                jsonContent="[]"
            />
        </>
    );
};
