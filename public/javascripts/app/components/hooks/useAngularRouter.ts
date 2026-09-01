// Minimal structural types for the AngularJS services we bridge into React. We
// only model the members we actually call, avoiding a dependency on the full
// `angular` type surface.
type AngularLocation = {
	// `$location.url()` reads the current url; `$location.url(path)` sets it.
	url: {
		(): string;
		(path: string): void;
	};
};

type AngularRootScope = {
	$apply: (fn: () => void) => void;
	// Present at runtime; used to avoid `$apply` while a digest is already in flight.
	$$phase?: string | null;
};

type ProvidedServices = {
	location: AngularLocation;
	rootScope: AngularRootScope;
};

// Statically provisioned once at Angular bootstrap (see AngularBridgeService).
// React components never receive these as props; they reach them via the hook.
let provided: ProvidedServices | null = null;

/**
 * Capture the AngularJS `$location` and `$rootScope` services into a
 * module-scoped singleton so React components can navigate without having the
 * services injected as props.
 *
 * Called once during bootstrap by the `AngularBridgeService`.
 */
const provideAngularServices = (
	location: AngularLocation,
	rootScope: AngularRootScope
): void => {
	provided = { location, rootScope };
};

const getProvided = (): ProvidedServices => {
	if (!provided) {
		throw new Error(
			'useAngularRouter: Angular services have not been provisioned. ' +
				'Ensure AngularBridgeService is instantiated at bootstrap.'
		);
	}
	return provided;
};

type AngularRouter = {
	/** Current Angular route url (path + query + hash). */
	getUrl: () => string;
	/** Navigate to `path`, wrapping the change in an Angular digest if needed. */
	setUrl: (path: string) => void;
};

/**
 * React hook exposing a location getter/setter backed by the statically
 * provisioned AngularJS `$location`/`$rootScope`.
 *
 * `setUrl` mirrors the legacy safe-apply pattern (see utils/safe-apply.js):
 * navigation triggered outside a digest is wrapped in `$rootScope.$apply`, but
 * writes already inside a digest run directly to avoid an "$apply already in
 * progress" error.
 */
const useAngularRouter = (): AngularRouter => {
	const getUrl = (): string => getProvided().location.url();

	const setUrl = (path: string): void => {
		const { location, rootScope } = getProvided();
		const phase = rootScope.$$phase;
		if (phase === '$apply' || phase === '$digest') {
			location.url(path);
		} else {
			rootScope.$apply(() => {
				location.url(path);
			});
		}
	};

	return { getUrl, setUrl };
};

export { provideAngularServices, useAngularRouter };
export type { AngularLocation, AngularRootScope };
