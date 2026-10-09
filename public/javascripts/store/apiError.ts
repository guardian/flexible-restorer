export const errorMessage = (error: unknown): string => {
    if (typeof error === 'string' && error.trim()) return error;
    if (error && typeof error === 'object') {
        if ('data' in error && error.data) return errorMessage(error.data);
        if ('message' in error && typeof error.message === 'string') return error.message;
        if ('error' in error && typeof error.error === 'string') return error.error;
        if ('status' in error) return `Request failed (${String(error.status)})`;
    }
    return 'Something went wrong. Please try again.';
};