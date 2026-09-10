import mediator from '../../utils/mediator';

// Channels shared with the still-AngularJS controllers. The migrated sidebar is
// authoritative for the active selection but continues to broadcast the same
// events so `SnapshotListCtrl` (content loading + analytics), `SnapshotContentCtrl`
// (html/json toggle) and the restore modal keep working unchanged.
const CHANNELS = {
	setActive: 'snapshot-list:set-active',
	displayHtml: 'snapshot-list:display-html',
	displayJson: 'snapshot-list:display-json',
	displayModal: 'snapshot-list:display-modal',
	hiddenModal: 'snapshot-list:hidden-modal',
} as const;

/** Tell Angular which snapshot is active; it loads the content + fires analytics. */
const publishSetActive = (index: number): void =>
	mediator.publish(CHANNELS.setActive, index);

/** Switch the (still-Angular) content panel to the rendered HTML view. */
const publishDisplayHtml = (): void => mediator.publish(CHANNELS.displayHtml);

/** Switch the content panel to the raw JSON view. */
const publishDisplayJson = (): void => mediator.publish(CHANNELS.displayJson);

/** Open the restore modal (owned by `ModalController`/`RestoreFormCtrl`). */
const publishDisplayModal = (): void => mediator.publish(CHANNELS.displayModal);

/**
 * Subscribe to the modal-closed event. Returns an unsubscribe function suitable
 * for a React effect cleanup.
 */
const subscribeHiddenModal = (callback: () => void): (() => void) => {
	const handler = (): void => callback();
	mediator.subscribe(CHANNELS.hiddenModal, handler);
	return () => mediator.remove(CHANNELS.hiddenModal, handler);
};

export {
	publishSetActive,
	publishDisplayHtml,
	publishDisplayJson,
	publishDisplayModal,
	subscribeHiddenModal,
};
