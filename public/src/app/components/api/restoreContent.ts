// POST a source snapshot to the chosen destination; the URL identifies both
// stacks and the source snapshot's content id and timestamp.
const restoreUrl = (
	sourceSystemId: string,
	contentId: string,
	sourceTimestamp: string,
	destinationSystemId: string,
): string =>
	`/api/1/restore/${sourceSystemId}/${contentId}/${sourceTimestamp}/to/${destinationSystemId}`;

/**
 * Restore the source snapshot into the destination stack. Resolves on success
 * and throws on a failed request so the caller can surface the error modal.
 */
const restoreContent = async (params: {
	sourceSystemId: string;
	contentId: string;
	sourceTimestamp: string;
	destinationSystemId: string;
}): Promise<void> => {
	const { sourceSystemId, contentId, sourceTimestamp, destinationSystemId } =
		params;

	const response = await fetch(
		restoreUrl(
			sourceSystemId,
			contentId,
			sourceTimestamp,
			destinationSystemId,
		),
		{ method: 'POST', credentials: 'same-origin' },
	);

	if (!response.ok) {
		throw new Error(`Restore request failed (${response.status})`);
	}
};

export { restoreContent, restoreUrl };
