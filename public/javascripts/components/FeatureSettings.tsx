import { useState } from 'react';
import { css } from '@emotion/react';
import { Button } from '@guardian/stand/Button';
import { Checkbox } from '@guardian/stand/Checkbox';
import { Modal, Dialog } from '@guardian/stand/Modal';
import { useAppDispatch, useFeatureFlag } from '../store/hooks';
import { resetFeatureFlags, setFeatureFlag } from '../store/featureFlags';

export const FeatureSettings: React.FunctionComponent = () => {
    const [isOpen, setOpen] = useState(false);
    const compact = useFeatureFlag('compactSnapshotList');
    const dispatch = useAppDispatch();
    return <>
        <Button icon="settings" variant="secondary" onPress={() => setOpen(true)}>Feature flags</Button>
        <Modal isOpen={isOpen} onOpenChange={setOpen} isDismissable
            theme={{ modal: { width: '440px', maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100dvh - 32px)' } }} cssOverrides={css({ overflowY: 'auto' })}>
            <Dialog aria-label="Feature flags">
                <Dialog.Header>Feature flags</Dialog.Header>
                <Dialog.Content cssOverrides={css({ display: 'grid', gap: 24 })}>
                <Checkbox isSelected={compact} onChange={(enabled) => dispatch(setFeatureFlag({ name: 'compactSnapshotList', enabled }))}>Compact snapshot list</Checkbox>
                <Button variant="secondary" onPress={() => dispatch(resetFeatureFlags())}>Use server defaults</Button>
                <Button onPress={() => setOpen(false)}>Done</Button>
                </Dialog.Content>
            </Dialog>
        </Modal>
    </>;
};