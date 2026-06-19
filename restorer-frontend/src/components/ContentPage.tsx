import { Layout } from "@guardian/stand/Layout";
import { useCallback, useEffect, useState } from "react";
import {
    SnapshotIdModel,
    type SnapshotData,
    type VersionListItem,
} from "../models";
import { SnapshotService } from "../services/SnapshotService";
import { ConfirmRestoreModal } from "./ConfirmRestoreModal";
import { ModalFrame } from "./ModalFrame";
import { RestoreList } from "./RestoreList";
import { SnapshotContent } from "./SnapshotContent";

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
    const [isRestoring, setIsRestoring] = useState(false);
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

    const activeItem = itemList?.[activeVersionIndex];

    const requestRestore = useCallback(() => {
        console.log("restore", activeItem);
        setShowRestoreModal(false);
        setIsRestoring(true);
        // TO DO - see public/javascripts/app/services/RestoreService.js for api post
    }, [activeItem]);

    useEffect(() => {
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
    }, [contentId, snapshotService, activeItem]);

    return (
        <>
            <ConfirmRestoreModal
                requestRestore={requestRestore}
                close={() => setShowRestoreModal(false)}
                isOpen={showRestoreModal}
                item={itemList?.[activeVersionIndex]}
            />

            <ModalFrame isOpen={isLoadingList || isLoadingSnapshot}>
                Loading...
            </ModalFrame>

            <ModalFrame isOpen={isRestoring}>Restoring...</ModalFrame>

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
