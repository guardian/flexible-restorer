import type { APIRequestContext } from "@playwright/test";

/**
 * Reset the mock flexible-content API back to its default state by calling its
 * `POST /__admin/reset` admin endpoint.
 *
 * Scenarios tagged `@state-modifying` change the shared mock's state (via
 * `setDestinationChangeDetails`). Because every worker talks to the same mock
 * container, that state must be cleared once the scenario's assertions are done
 * so it cannot leak into later scenarios.
 */
export async function resetMockState(
    request: APIRequestContext,
    mockApiUrl: string,
): Promise<void> {
    await request.post(`${mockApiUrl}/__admin/reset`);
}
