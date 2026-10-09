import { useRef, useState } from 'react';
import { css } from '@emotion/react';
import { Button } from '@guardian/stand/Button';
import { Checkbox } from '@guardian/stand/Checkbox';
import { Modal, Dialog } from '@guardian/stand/Modal';
import { Radio, RadioGroup } from '@guardian/stand/RadioGroup';
import { Typography } from '@guardian/stand/Typography';
import { composerUrl, formatDate } from '../models';
import type { Version } from '../models';
import { useAppDispatch } from '../store/hooks';
import { closeModal, setError } from '../store/uiSlice';
import { useGetDestinationsQuery, useRestoreMutation } from '../store/restorerApi';

export const RestoreModal: React.FunctionComponent<{ version: Version; canRestoreToAnyStack: boolean }> = ({ version, canRestoreToAnyStack }) => {
    const dispatch = useAppDispatch();
    const [selfOut, setSelfOut] = useState(false);
    const [othersOut, setOthersOut] = useState(false);
    const [destinationId, setDestinationId] = useState<string>();
    const submitting = useRef(false);
    const { currentData, isFetching, isError } = useGetDestinationsQuery(version.contentId, { refetchOnMountOrArgChange: true });
    const [restore, { isLoading }] = useRestoreMutation();
    const destinations = (isError ? [] : currentData ?? []).filter((destination) => canRestoreToAnyStack || destination.systemId === version.system.id);
    const defaultDestination = destinations.find((destination) => destination.systemId === version.system.id && destination.available)
        ?? destinations.find((destination) => destination.available);
    const selected = destinations.find((destination) => destination.systemId === (destinationId ?? defaultDestination?.systemId));
    const targetUrl = selected && composerUrl(selected.composerPrefix, version.contentId);
    const canSubmit = selfOut && othersOut && selected?.available && targetUrl && !isFetching && !isLoading;
    const close = () => { if (!submitting.current) dispatch(closeModal()); };
    return <Modal isOpen isDismissable={!isLoading} isKeyboardDismissDisabled={isLoading} onOpenChange={(open) => { if (!open) close(); }}
        theme={{ modal: { width: '640px', maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100dvh - 32px)', padding: { top: '24px', bottom: '24px', left: '24px', right: '24px' } } }}
        cssOverrides={css({ overflowY: 'auto' })}>
        <Dialog aria-label="Before you restore" cssOverrides={css({ minWidth: 0, overflowWrap: 'anywhere' })}>
            <Dialog.Header>Before you restore</Dialog.Header>
            <Dialog.Content>
            <form onSubmit={(event) => {
                event.preventDefault();
                if (!canSubmit || !selected || !targetUrl || submitting.current) return;
                submitting.current = true;
                void (async () => {
                    try {
                        await restore({ systemId: version.system.id, contentId: version.contentId, timestamp: version.timestamp, destinationId: selected.systemId }).unwrap();
                        window.location.assign(targetUrl);
                    } catch (error: unknown) {
                        submitting.current = false;
                        dispatch(setError(error));
                    }
                })();
            }} css={css({ display: 'grid', gap: 24 })}>
                <section css={css({ display: 'grid', gap: 8 })}>
                    <Typography element="h3" variant="headingSm">From:</Typography>
                    <Typography>Snapshot of revision {version.revision ?? '-'} taken {version.system.isSecondary ? 'from secondary ' : ''}at {formatDate(version.timestamp)}</Typography>
                </section>
                <RadioGroup label="To:" value={selected?.systemId ?? ''} onChange={setDestinationId} isDisabled={isLoading || isFetching}>
                    {destinations.map((destination) => <Radio key={destination.systemId} value={destination.systemId} isDisabled={!destination.available}>
                        {destination.displayName}{destination.changeDetails
                            ? `: currently has revision ${destination.changeDetails.revisionId}, last modified at ${formatDate(destination.changeDetails.lastModified)}`
                            : destination.available ? ': content not on this instance' : ': unavailable'}
                    </Radio>)}
                </RadioGroup>
                {isFetching && <Typography role="status">Loading destinations...</Typography>}
                {!isFetching && !destinations.some((destination) => destination.available) && <Typography role="status">There are no destinations available.</Typography>}
                <section css={css({ display: 'grid', gap: 12 })}>
                    <Typography element="h3" variant="headingSm">Make sure that:</Typography>
                    <Checkbox isSelected={selfOut} onChange={setSelfOut} isDisabled={isLoading}>You are not in content</Checkbox>
                    <Checkbox isSelected={othersOut} onChange={setOthersOut} isDisabled={isLoading}>No one else is in the content</Checkbox>
                </section>
                <div css={css({ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' })}>
                    <Button variant="secondary" onPress={close} isDisabled={isLoading}>Cancel</Button>
                    <Button type="submit" icon="restore" isDisabled={!canSubmit}>{isLoading ? 'Restoring...' : 'Restore Version'}</Button>
                </div>
            </form>
            </Dialog.Content>
        </Dialog>
    </Modal>;
};