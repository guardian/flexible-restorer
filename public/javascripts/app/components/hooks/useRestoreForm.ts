import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { skipToken } from '@reduxjs/toolkit/query/react';
import type { FormattedCreatedDate } from '../utils/dateFormat';
import { formatCreatedDate } from '../utils/dateFormat';
import {
	useGetRestoreDestinationsQuery,
	useGetSnapshotListQuery,
	useGetUserQuery,
	useRestoreContentMutation,
} from '../store/api';
import { selectActiveIndex, useAppDispatch, useAppSelector } from '../store/hooks';
import { closeModal, setError } from '../store/viewerSlice';
import type { RestoreDestination } from '../api/fetchRestoreDestinations';

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
 * The active (source) snapshot is resolved from the shared version list plus the
 * `activeIndex` in the Redux viewer slice (owned by the sidebar). When `isOpen`
 * becomes true the user's permissions and the restore destinations are loaded
 * via RTK Query, the cross-stack filter is applied and the current system (or
 * the first destination) is preselected.
 */
const useRestoreForm = (contentId: string, isOpen: boolean): UseRestoreForm => {
	const { data: snapshots } = useGetSnapshotListQuery(contentId);
	const dispatch = useAppDispatch();
	const activeIndex = useAppSelector(selectActiveIndex);
	const activeSnapshot = snapshots?.[activeIndex] ?? snapshots?.[0];

	const [selectedSystemId, setSelectedSystemId] = useState<string | undefined>(
		undefined,
	);
	const [selfInContent, setSelfInContent] = useState(false);
	const [elseInContent, setElseInContent] = useState(false);

	// Load permissions + destinations while the modal is open. Failures are
	// swallowed (empty destinations), matching the legacy RestoreFormCtrl.
	// `refetchOnMountOrArgChange` reloads destinations each time the modal
	// reopens, matching the legacy per-open fetch (RTK Query would otherwise
	// serve a stale cache). `currentData` (not `data`) is used so a failed
	// reload clears the previous destinations rather than retaining them.
	const { data: user } = useGetUserQuery(isOpen ? undefined : skipToken);
	const { currentData: rawDestinations } = useGetRestoreDestinationsQuery(
		isOpen && activeSnapshot ? contentId : skipToken,
		{ refetchOnMountOrArgChange: true },
	);
	const [restore, { isLoading }] = useRestoreContentMutation();

	const canRestoreToAnyStack =
		user?.permissions?.restore_content_to_any_stack === true;
    // TODO: can we pull this out?
	const destinations = useMemo<RestoreDestinationView[]>(() => {
		if (!activeSnapshot || !rawDestinations) {
			return [];
		}
		const activeSystemId = activeSnapshot.systemId;
		return rawDestinations
			.filter(
				(destination) =>
					canRestoreToAnyStack || destination.systemId === activeSystemId,
			)
			.map(toDestinationView);
	}, [rawDestinations, canRestoreToAnyStack, activeSnapshot]);

	// Preselect the current system (or the first destination) once they resolve.
	useEffect(() => {
		if (!isOpen) {
			return;
		}
		const activeSystemId = activeSnapshot?.systemId;
		const selected =
			destinations.find(
				(destination) => destination.systemId === activeSystemId,
			) ?? destinations[0];
		setSelectedSystemId(selected?.systemId);
	}, [destinations, isOpen, activeSnapshot]);

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
		setSelectedSystemId(undefined);
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
		restore({
			sourceSystemId: activeSnapshot.systemId,
			contentId,
			sourceTimestamp: activeSnapshot.timestamp,
			destinationSystemId: destination.systemId,
		})
			.unwrap()
			.then(() => {
				// Redirect back to the destination Composer instance.
				window.location.href = `${destination.composerPrefix}/content/${contentId}`;
			})
			.catch((error: unknown) => {
				// Close the modal so the error modal isn't hidden behind it.
				dispatch(closeModal());
				dispatch(setError(error));
			});
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
