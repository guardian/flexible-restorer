import type { APIResponse } from "@playwright/test";

/**
 * A tiny shared holder for the most recent API response captured by a When
 * step, so a generic Then such as `the response should be not found` can assert
 * on it regardless of which feature/step produced it. Each producing step sets
 * this via `setLastApiResponse`; the asserting step reads it via
 * `getLastApiResponse`.
 */
let lastApiResponse: APIResponse | undefined;

export function setLastApiResponse(response: APIResponse | undefined): void {
    lastApiResponse = response;
}

export function getLastApiResponse(): APIResponse | undefined {
    return lastApiResponse;
}
