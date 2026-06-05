import { Layout } from "@guardian/stand/Layout";
import { useEffect, useState } from "react";
import {
    SnapshotIdModel,
    type SnapshotData,
    type VersionListItem,
} from "../models";
import { SnapshotService } from "../services/SnapshotService";
import { RestoreList } from "./RestoreList";
import { SnapshotContent } from "./SnapshotContent";
import { Button } from "react-aria-components";

interface Props {
    contentId: string;
}

export const ContentPage = ({ contentId }: Props) => {
    const [snapshotService] = useState(new SnapshotService());
    const [itemList, setItemList] = useState<VersionListItem[]>();
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [activeVersionIndex, setActiveVersionIndex] = useState(0);
    const [isLoadingSnapshot, setisLoadingSnapshot] = useState(false);
    const [snapshot, setSnapshot] = useState<SnapshotData>();

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

            {showRestoreModal && (
                <Layout.AlertBanner>
                    <div>TO DO - restore modal</div>
                    <Button onClick={() => setShowRestoreModal(false)}>
                        close
                    </Button>
                </Layout.AlertBanner>
            )}

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
                    contentId={contentId}
                    snapshot={snapshot}
                    openConfirmationModal={() => setShowRestoreModal(true)}
                />
            </Layout.Main>
        </>
    );
};
