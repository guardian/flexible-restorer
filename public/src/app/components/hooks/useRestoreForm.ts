import { skipToken } from '@reduxjs/toolkit/query/react';
import { useEffect, useMemo, useState } from 'react';
import type { RestoreDestinationView } from '../api/fetchRestoreDestinations';
import {
	useLazyGetRestoreDestinationsQuery,
	useRestoreContentMutation,
} from '../store/flexibleApi';
import { useActiveIndex, useAppDispatch } from '../store/hooks';
import { useGetSnapshotListQuery, useGetUserQuery } from '../store/restorerApi';
import { closeModal, setError } from '../store/viewerSlice';
import type { FormattedCreatedDate } from '../utils/dateFormat';
import { formatCreatedDate } from '../utils/dateFormat';

/** Source snapshot summary shown in the modal's "From:" column. */
type RestoreSource = {
	revisionId: number | undefined;
	isSecondary: boolean;
	date: FormattedCreatedDate;
};

type UseRestoreForm = {
	isLoading: boolean;
	/** True once the source, permissions and destinations have finished loading. */
	isReady: boolean;
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

/**
 * Restore-form state and behaviour, ported from the legacy restore form
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
	const activeIndex = useActiveIndex();
	const activeSnapshot = snapshots?.[activeIndex] ?? snapshots?.[0];

	const [selectedSystemId, setSelectedSystemId] = useState<
		string | undefined
	>(undefined);
	const [selfInContent, setSelfInContent] = useState(false);
	const [elseInContent, setElseInContent] = useState(false);

	// Permissions gate the cross-stack destination filter; load them while open.
	const { data: user, isSuccess: isUserLoaded } = useGetUserQuery(
		isOpen ? undefined : skipToken,
	);

	// Fetch destinations with a lazy query, forcing a fresh network fetch on each
	// open (`preferCacheValue: false`) so the modal never shows a stale cached
	// list on reopen. `isDestinationsReady` flips true only once the fetch for the
	// current open has settled, which the modal uses to avoid an open-time flicker.
	const [triggerDestinations] = useLazyGetRestoreDestinationsQuery();
	const [rawDestinations, setRawDestinations] = useState<
		RestoreDestinationView[]
	>([]);
	const [isDestinationsReady, setIsDestinationsReady] = useState(false);
	useEffect(() => {
		if (!isOpen || !activeSnapshot) {
			setRawDestinations([]);
			setIsDestinationsReady(false);
			return;
		}
		let cancelled = false;
		setIsDestinationsReady(false);
		triggerDestinations(contentId, false)
			.unwrap()
			.then((data) => {
				if (!cancelled) {
					setRawDestinations(data);
					setIsDestinationsReady(true);
				}
			})
			.catch(() => {
				// A failed/empty fetch leaves no destinations (legacy behaviour).
				if (!cancelled) {
					setRawDestinations([]);
					setIsDestinationsReady(true);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [isOpen, activeSnapshot, contentId, triggerDestinations]);

	const [restore, { isLoading }] = useRestoreContentMutation();

	// Only reveal the modal once the source, permissions and destinations are all
	// settled, so its content does not flicker in after it opens.
	const isReady =
		isOpen && !!activeSnapshot && isUserLoaded && isDestinationsReady;

	const canRestoreToAnyStack =
		user?.permissions?.restore_content_to_any_stack === true;
	// Destinations are parsed to view models on ingress (see api.ts); this only
	// applies the cross-stack permission filter, which needs the user's
	// permissions and the active snapshot's system — inputs the endpoint lacks.
	const destinations = useMemo<RestoreDestinationView[]>(() => {
		if (!activeSnapshot) {
			return [];
		}
		const activeSystemId = activeSnapshot.systemId;
		return rawDestinations.filter(
			(destination) =>
				canRestoreToAnyStack || destination.systemId === activeSystemId,
		);
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
		isReady,
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
export type { UseRestoreForm, RestoreSource };
export type { RestoreDestinationView } from '../api/fetchRestoreDestinations';
