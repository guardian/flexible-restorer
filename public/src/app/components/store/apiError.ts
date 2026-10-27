// Shared error handling for the RTK Query service APIs. The underlying `fetch*`
// helpers throw `Error`s; we retain only the message so Redux state stays
// serialisable while the error modal can still show it (see viewerSlice).
type ApiError = { message: string };

const toApiError = (error: unknown): ApiError => ({
	message:
		error instanceof Error
			? error.message
			: typeof error === 'string'
				? error
				: String(error),
});

export { toApiError };
export type { ApiError };
