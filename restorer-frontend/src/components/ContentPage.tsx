import { useEffect, useState } from "react";
import {
    SnapshotIdModel,
    type VersionListItem,
    type SnapshotData,
} from "../models";
import { SnapshotService } from "../services/SnapshotService";
import { RestoreList } from "./RestoreList";
import { Layout } from "@guardian/stand/Layout";
import { SnapshotContent } from "./SnapshotContent";

interface Props {
    contentId: string;
}

export const ContentPage = ({ contentId }: Props) => {
    const [snapshotService] = useState(new SnapshotService());
    const [itemList, setItemList] = useState<VersionListItem[]>();
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [activeVersionIndex, setActiveVersionIndex] = useState(0);
    const [isLoadingSnapshot, setisLoadingSnapshot] = useState(false);
    const [snapshot, setSnapshot] =
        useState<SnapshotData>();

    useEffect(() => {
        snapshotService
            .getList(contentId)
            .then((versions) => {
                versions.reverse();
                setItemList(versions);
            })
            .finally(() => {
                setIsLoadingList(false);
            });
    }, [contentId, snapshotService]);

    useEffect(() => {
        const activeItem = itemList?.[activeVersionIndex];

        if (activeItem) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setisLoadingSnapshot(true);

            const model = new SnapshotIdModel(activeItem);
            snapshotService
                .getSnapshot(model.systemId, model.contentId, model.timestamp)
                .then((data) => {
                    console.log("fetched", data);
                    setSnapshot(data);
                })
                .finally(() => {
                    setisLoadingSnapshot(false);
                });
        }
    }, [contentId, snapshotService, activeVersionIndex, itemList]);

    return (
        <>
            {/* TO DO - overlay modal component */}
            <dialog open={isLoadingList || isLoadingSnapshot}>
                Loading...
            </dialog>

            <Layout.Sidebar>
                <RestoreList
                    activeVersionIndex={activeVersionIndex}
                    setActiveVersionIndex={setActiveVersionIndex}
                    items={itemList}
                    articleHash={contentId}
                />
            </Layout.Sidebar>

            <Layout.Main>
                <SnapshotContent
                    activeItem={itemList?.[activeVersionIndex]}
                    canRestore={false}
                    copyButtonLabel={"Copy"}
                    displayButtonLabel={"Display JSON"}
                    contentId={contentId}
                    snapshot={snapshot}
                />
            </Layout.Main>
        </>
    );
};
