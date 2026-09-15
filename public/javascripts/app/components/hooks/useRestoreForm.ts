import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { useSnapshotList } from './useSnapshotList';
import type { FormattedCreatedDate } from '../utils/dateFormat';
import { formatCreatedDate } from '../utils/dateFormat';
import {
	publishError,
	publishRestoreTracked,
	subscribeSetActive,
} from '../utils/mediator';
import { fetchUser } from '../api/fetchUser';
import { fetchRestoreDestinations } from '../api/fetchRestoreDestinations';
import type { RestoreDestination } from '../api/fetchRestoreDestinations';
import { restoreContent } from '../api/restoreContent';

/** Per-destination change summary, ported from `RestoreFormCtrl`'s `changeString`. */
type DestinationChange =
	| { kind: 'revision'; revisionId: number; date: FormattedCreatedDate }
	| { kind: 'not-on-instance' }
	| { kind: 'none' };

/** A restore destination prepared for rendering as a radio option. */
type RestoreDestinationView = {
	systemId: string;
	displayName: string;
	available: boolean;
	composerPrefix: string;
	change: DestinationChange;
};

/** Source snapshot summary shown in the modal's "From:" column. */
type RestoreSource = {
	revisionId: number | undefined;
	isSecondary: boolean;
	date: FormattedCreatedDate;
};

type UseRestoreForm = {
	isLoading: boolean;
	source: RestoreSource | undefined;
	destinations: RestoreDestinationView[];
	selectedSystemId: string | undefined;
	setSelectedSystemId: (systemId: string) => void;
	selfInContent: boolean;
	setSelfInContent: (value: boolean) => void;
	elseInContent: boolean;
	setElseInContent: (value: boolean) => void;
	submit: () => void;
	reset: () => void;
};

/** Prepare a raw destination for rendering (ported from `RestoreFormCtrl`). */
const toDestinationView = (
	destination: RestoreDestination,
): RestoreDestinationView => {
	const { systemId, displayName, available, composerPrefix, changeDetails } =
		destination;

	let change: DestinationChange;
	if (changeDetails) {
		change = {
			kind: 'revision',
			revisionId: changeDetails.revisionId,
			date: formatCreatedDate(moment(changeDetails.lastModified)),
		};
	} else if (available) {
		change = { kind: 'not-on-instance' };
	} else {
		change = { kind: 'none' };
	}

	return { systemId, displayName, available, composerPrefix, change };
};

/**
 * Restore-form state and behaviour, ported from the AngularJS `RestoreFormCtrl`
 * and `RestoreService`.
 *
 * The active (source) snapshot is resolved the same way the sidebar does — from
 * the shared, SWR-cached version list plus the `snapshot-list:set-active`
 * mediator event — so no Angular services are injected. When `isOpen` becomes
 * true the user's permissions and the restore destinations are loaded, the
 * cross-stack filter is applied and the current system (or the first
 * destination) is preselected.
 */
const useRestoreForm = (contentId: string, isOpen: boolean): UseRestoreForm => {
	const { snapshots } = useSnapshotList(contentId);
	const [activeIndex, setActiveIndex] = useState(0);

	// The sidebar owns the active selection and broadcasts it; default to the
	// first (newest) snapshot, matching the sidebar's own default.
	useEffect(() => subscribeSetActive(setActiveIndex), []);

	const activeSnapshot = snapshots?.[activeIndex] ?? snapshots?.[0];

	const [isLoading, setIsLoading] = useState(false);
	const [destinations, setDestinations] = useState<RestoreDestinationView[]>(
		[],
	);
	const [selectedSystemId, setSelectedSystemId] = useState<string | undefined>(
		undefined,
	);
	const [selfInContent, setSelfInContent] = useState(false);
	const [elseInContent, setElseInContent] = useState(false);

	// Load permissions + destinations each time the modal opens.
	useEffect(() => {
		if (!isOpen || !activeSnapshot) {
			return;
		}
		let cancelled = false;

		const load = async (): Promise<void> => {
			// Resolve permissions first so the cross-stack filter is applied
			// against a settled value (mirrors the ordering in RestoreFormCtrl).
			let canRestoreToAnyStack = false;
			try {
				const user = await fetchUser();
				canRestoreToAnyStack =
					user.permissions?.restore_content_to_any_stack === true;
			} catch {
				canRestoreToAnyStack = false;
			}

			try {
				const raw = await fetchRestoreDestinations(contentId);
				if (cancelled) {
					return;
				}
				const activeSystemId = activeSnapshot.systemId;
				const visible = raw
					.filter(
						(destination) =>
							canRestoreToAnyStack ||
							destination.systemId === activeSystemId,
					)
					.map(toDestinationView);
				const selected =
					visible.find(
						(destination) => destination.systemId === activeSystemId,
					) ?? visible[0];

				setDestinations(visible);
				setSelectedSystemId(selected?.systemId);
				setIsLoading(false);
			} catch {
				if (cancelled) {
					return;
				}
				setDestinations([]);
				setSelectedSystemId(undefined);
				setIsLoading(false);
			}
		};
		void load();
		return () => {
			cancelled = true;
		};
	}, [isOpen, activeSnapshot, contentId]);

	const source = useMemo<RestoreSource | undefined>(() => {
		if (!activeSnapshot) {
			return undefined;
		}
		return {
			revisionId: activeSnapshot.revisionId,
			isSecondary: activeSnapshot.isSecondary,
			date: formatCreatedDate(activeSnapshot.createdDate),
		};
	}, [activeSnapshot]);

	const reset = (): void => {
		setDestinations([]);
		setSelectedSystemId(undefined);
		setIsLoading(false);
		setSelfInContent(false);
		setElseInContent(false);
	};

	const submit = (): void => {
		const destination = destinations.find(
			(candidate) => candidate.systemId === selectedSystemId,
		);
		if (!activeSnapshot || !destination) {
			return;
		}
		setIsLoading(true);
		publishRestoreTracked(contentId, activeSnapshot.timestamp);
		restoreContent({
			sourceSystemId: activeSnapshot.systemId,
			contentId,
			sourceTimestamp: activeSnapshot.timestamp,
			destinationSystemId: destination.systemId,
		})
			.then(() => {
				// Redirect back to the destination Composer instance.
				window.location.href = `${destination.composerPrefix}/content/${contentId}`;
			})
			.catch((error: unknown) => publishError(error));
	};

	return {
		isLoading,
		source,
		destinations,
		selectedSystemId,
		setSelectedSystemId,
		selfInContent,
		setSelfInContent,
		elseInContent,
		setElseInContent,
		submit,
		reset,
	};
};

export { useRestoreForm };
export type { UseRestoreForm, RestoreDestinationView, RestoreSource, DestinationChange };
