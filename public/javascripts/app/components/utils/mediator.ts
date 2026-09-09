import mediator from '../../utils/mediator';

// Channels shared with the still-AngularJS controllers. The migrated sidebar is
// authoritative for the active selection but continues to broadcast the same
// events so `SnapshotListCtrl` (content loading + analytics), `SnapshotContentCtrl`
// (html/json toggle) and the restore modal keep working unchanged.
const CHANNELS = {
	setActive: 'snapshot-list:set-active',
	loadContent: 'snapshot-list:load-content',
	displayHtml: 'snapshot-list:display-html',
	displayJson: 'snapshot-list:display-json',
	displayModal: 'snapshot-list:display-modal',
	closeModal: 'snapshot-list:close-modal',
	hiddenModal: 'snapshot-list:hidden-modal',
	error: 'error',
	trackEvent: 'track:event',
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
 * Announce the restore modal has closed. Mirrors the legacy `ModalController`,
 * which published this on close so the (still-Angular) content panel resets to
 * the HTML view and the React sidebar clears its "modal" display state.
 */
const publishHiddenModal = (): void => mediator.publish(CHANNELS.hiddenModal);

/** Broadcast an application error so the Angular error modal is shown. */
const publishError = (error: unknown): void =>
	mediator.publish(CHANNELS.error, error);

/**
 * Fire the "Snapshot Restored" analytics event, matching the legacy
 * `RestoreService` publish. Kept so any `track:event` listener sees the same
 * signal after the restore request is issued.
 */
const publishRestoreTracked = (
	contentId: string,
	snapshotTime: string,
): void =>
	mediator.publish(CHANNELS.trackEvent, 'Snapshot', 'Restored', null, null, {
		contentId,
		snapshotTime,
	});

/**
 * Fire the "Snapshot Viewed" analytics event, matching the legacy
 * `SnapshotContentCtrl` publish on initial load.
 */
const publishSnapshotViewed = (
	contentId: string,
	snapshotTime: string,
): void =>
	mediator.publish(CHANNELS.trackEvent, 'Snapshot', 'Viewed', null, null, {
		contentId,
		snapshotTime,
	});

/**
 * Subscribe to the modal-open request. Returns an unsubscribe function suitable
 * for a React effect cleanup.
 */
const subscribeDisplayModal = (callback: () => void): (() => void) => {
	const handler = (): void => callback();
	mediator.subscribe(CHANNELS.displayModal, handler);
	return () => mediator.remove(CHANNELS.displayModal, handler);
};

/** Subscribe to the explicit modal-close request. */
const subscribeCloseModal = (callback: () => void): (() => void) => {
	const handler = (): void => callback();
	mediator.subscribe(CHANNELS.closeModal, handler);
	return () => mediator.remove(CHANNELS.closeModal, handler);
};

/** Subscribe to application errors (used to close the modal, as the legacy controller did). */
const subscribeError = (callback: () => void): (() => void) => {
	const handler = (): void => callback();
	mediator.subscribe(CHANNELS.error, handler);
	return () => mediator.remove(CHANNELS.error, handler);
};

/** Subscribe to active-snapshot changes broadcast by the sidebar. */
const subscribeSetActive = (
	callback: (index: number) => void,
): (() => void) => {
	const handler = (...args: unknown[]): void => callback(args[0] as number);
	mediator.subscribe(CHANNELS.setActive, handler);
	return () => mediator.remove(CHANNELS.setActive, handler);
};

/**
 * Subscribe to the "load this snapshot" event published by `SnapshotListCtrl`
 * when the selection changes, carrying the system/content/timestamp identifiers.
 */
const subscribeLoadContent = (
	callback: (systemId: string, contentId: string, timestamp: string) => void,
): (() => void) => {
	const handler = (...args: unknown[]): void =>
		callback(args[0] as string, args[1] as string, args[2] as string);
	mediator.subscribe(CHANNELS.loadContent, handler);
	return () => mediator.remove(CHANNELS.loadContent, handler);
};

/** Subscribe to the request to show the rendered HTML view. */
const subscribeDisplayHtml = (callback: () => void): (() => void) => {
	const handler = (): void => callback();
	mediator.subscribe(CHANNELS.displayHtml, handler);
	return () => mediator.remove(CHANNELS.displayHtml, handler);
};

/** Subscribe to the request to show the raw JSON view. */
const subscribeDisplayJson = (callback: () => void): (() => void) => {
	const handler = (): void => callback();
	mediator.subscribe(CHANNELS.displayJson, handler);
	return () => mediator.remove(CHANNELS.displayJson, handler);
};

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
	publishHiddenModal,
	publishError,
	publishRestoreTracked,
	publishSnapshotViewed,
	subscribeDisplayModal,
	subscribeCloseModal,
	subscribeError,
	subscribeSetActive,
	subscribeLoadContent,
	subscribeDisplayHtml,
	subscribeDisplayJson,
	subscribeHiddenModal,
};
