# Aim

We want to migrate the frontend of this project to React, and use the Stand UI library.
Language
We will use Typescript in its strictest mode.
Build tooling
We will use Vite to bundle the application. We will use Vitest to add unit tests. Node’s own test runner was considered, but there are advantages to using vitest:
More comprehensive assertion patterns,
Output that is easier for humans (and robots) to parse
An test environment that is identical to the production build

## UI Library

We will use the Guardian Stand UI library - https://guardian.github.io/stand/?path=/docs/getting-started--docs

We will try to use this as much as possible but we may need to

- write our own application specific components
- promote these to stand components if this is useful
  State management
  We will use a combination of React native hooks for component local state, and Redux for inter-component state management.
  We want to use redux-toolkit to manage the async state. The point at which we will use redux over hooks will be application specific. Here are Code examples of when to use hooks vs redux

We would use hooks when we are managing state local to a component or a small number of tightly coupled components, for example showing and hiding a section of a webpage on screen, the show/hide state would use a hook.

We would use redux when we are managing async interactions or when there is a more complex state which is shared between a larger number of components, or components that are in unrelated parts of the UI that would require a lot of prop drilling to share.

## Feature switching

There is a widely used pattern to do this, but no shareable code. We will roll our own by setting feature flags and their defaults server side in a cookie. Our UI will then honour the server side values, but allow the user to override defaults to turn them on or off. The UI needs to provide a way to set the feature flags.

## Running Angular and React components

To be able to do a strangler pattern migration, we will need to run angular and react components side by side.
The best way to do this is using the https://www.npmjs.com/package/react2angular react2angular library.

Aim to minimise the number of props we pass to React components from an Angular context. When interacting with foundational Angular services like $location, do not pass these directly to components — instead, create hooks that provision their own instances of these services.

For example,

```Typescript
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
```

## Verification

We can use mise run test:e2e to verify everything is working

## Using the Stand component library

We should use the Guardian Stand React component library — https://guardian.github.io/stand/?path=/docs/getting-started--docs

Prefer Stand components over raw HTML elements
Reach for a Stand component before writing a raw HTML element. Stand components bake in the design-system styling, accessibility (labelling, focus management, ARIA) and theming, so a raw `<input>`, `<button>` or `<select>` in migrated code should be treated as a smell. Only drop down to a raw HTML element — or a custom component (see “React Component guidelines”) — when no Stand component covers the use case, and note briefly why.

When you do use a Stand component, expect its API to differ from the raw element:

- Form inputs (`TextInput`, `TextArea`, `Select`, `Checkbox`, `RadioGroup`, `DatePicker`) are built on react-aria-components. They render and associate their own `<label>` via the `label` prop (so you don’t need a separate `<label htmlFor>`), expose `isRequired`/`isDisabled` rather than `required`/`disabled`, and their `onChange` receives the new value directly, not a DOM event.
- Prefer the styling escape hatches in this order: `theme` → `cssOverrides` → `className` (mirrors the CSS priority below). Avoid raw inline styles on Stand components.

HTML element → Stand component mapping
Use this as the default first choice when migrating markup. If a pattern has no match here, check Storybook, then fall back to the CSS / React component guidelines below.

| HTML element / pattern                          | Stand component                                            |
| ----------------------------------------------- | ---------------------------------------------------------- |
| `<button>`                                      | `Button` (also `IconButton`, `LinkButton`, `AvatarButton`) |
| `<a>` / link                                    | `Link` (also `LinkButton`, `IconLinkButton`)               |
| `<input type="text">` and most text-like inputs | `TextInput`                                                |
| `<textarea>`                                    | `TextArea`                                                 |
| `<select>`                                      | `Select`                                                   |
| `<input type="checkbox">`                       | `Checkbox`                                                 |
| `<input type="radio">` group                    | `RadioGroup`                                               |
| `<input type="date">`                           | `DatePicker`                                               |
| `<h1>`–`<h6>`, `<p>`, `<span>` and other text   | `Typography`                                               |
| `<svg>` / inline icon                           | `Icon` (favicons: `Favicon`)                               |
| `<img>` avatar                                  | `Avatar` (also `AvatarLink`, `AvatarButton`)               |
| `<dialog>` / modal                              | `Modal`                                                    |
| tabbed UI                                       | `Tabs`                                                     |
| layout container (flex / stack / grid)          | `Layout`, `Grid`                                           |
| header / nav / menus                            | `TopBar`, `Menu`, `UserMenu`                               |
| alert / notification / inline validation        | `AlertBanner`, `InlineMessage`                             |

This reflects the components exported by `@guardian/stand` at time of writing; treat Storybook as the source of truth for the current set and exact props. There is no Stand replacement for the semantic `<form>` element itself — keep a raw `<form>` for submit handling and place Stand inputs inside it.

Enabling the emotion `css` prop
Stand and our own components rely on emotion’s `css` prop for one-off styling. tsconfig.json sets `jsxImportSource: "@emotion/react"` so `tsc` and webpack accept it. If the editor’s TypeScript server reports `Property 'css' does not exist on type ...`, add the per-file pragma as the very first line of the file:

/\*_ @jsxImportSource @emotion/react _/

## CSS

We want to migrate any existing sass or other css applied styles in the following order of priority
A Stand theme override
A Stand CssOverride if theming is not sufficient
Create a new parent component and migrate styles to use emotion/react with inline styles

Migrating SASS to emotion (and dropping the old class names)
When a feature is migrated to React we want to fully move its SASS into emotion so the
legacy BEM/Angular class names are no longer required. The class names are usually
load-bearing in two ways, so they cannot simply be deleted:

1. Remaining SASS rules still target them.
2. The e2e (Playwright) suite locates elements by them.

Follow this process, using a co-located `styles.ts` that exports a `styles` object of
`css(...)` blocks (one per element/variant), consumed via the `css` prop. This keeps the
markup class-free while matching the existing look.

Step 1 — Port the styles into emotion, watching for these easily-missed cases:

- Pseudo-elements (`::before`, `::after`) — e.g. hover overlays, or a decorative marker
  like the launch rocket. Remember emotion needs the `content` value quoted, e.g.
  `content: '" "'` or `content: '"\\uD83D\\uDE80"'`.
- Styles that were split across files. Layout for a block often lived in the component
  SASS while its fonts/`text-transform` lived in a shared file (e.g. `text.scss`). Port
  BOTH, or the migrated element loses its font/casing.
- Per-element fonts that relied on the element's class. Once the class is gone you must
  set the font on each element via its own `css` block (e.g. one block per `h6` row)
  rather than a single shared selector.
- Specificity/load-order overrides such as a trailing `div.foo { margin-bottom: 0 }` that
  overrode an earlier rule — fold the winning value directly into the emotion block.
- Variant/state selectors (`&.item-active`, `[variant=...]`) become a boolean argument to
  the style function (`item(isActive)`), returning conditional properties. Deliberately
  drop any variant the React markup will never render, and note the decision.

Step 2 — Replace class-based test hooks BEFORE removing the classes.

- Add `data-testid` attributes for elements the e2e suite selects, and expose element
  state as SEPARATE data attributes (`data-active`, `data-launch`) rather than encoding it
  in the testid value or a class. Booleans render as `"true"`/`"false"`, so an active row
  becomes `[data-testid="snapshot-list-item"][data-active="true"]`.
- Repoint the Playwright locators from `li.snapshot-list__item` / `li.item-active` /
  `.…__legally-sensitive` to the new `data-testid` selectors.

Step 3 — Remove the class names from the TSX. Every element should now style via `css`
and carry only `data-testid`/`data-*` where a test needs it.

Step 4 — Delete the now-dead SASS, distinguishing two cases:

- Files used ONLY by the migrated feature (e.g. `snapshot-list.scss`, `index-list.scss`
  and its mixins) — delete the file and remove its `@import` from `index.scss`.
- SHARED files (e.g. `text.scss`, which also styles still-Angular modals/content) — edit
  surgically. Remove only the migrated feature's selectors and keep everything still used
  by Angular views (fonts/`@font-face`, `.modal__*`, `.snapshot-content`, action-link
  rules, etc.). Never delete a shared file wholesale.
- Before deleting, confirm the classes are not still rendered by an Angular `*.html`
  template (grep the templates). Note that `mediator` event names like
  `snapshot-list:set-active` look similar but are NOT css classes — do not touch them.

Step 5 — Verify:

- `npx tsc --noEmit` from the repo root.
- Run the webpack build so the SASS entrypoint compiles without the deleted imports/mixins.
- Run the affected e2e specs in isolation first (`mise run test:e2e -- <spec-substring>`),
  then the full suite. The full suite can be flaky under load (page-load timeouts on
  unrelated specs, with an early "N did not run" abort); a failure only implicates your
  change if it references your new `data-testid`/`data-*` locators, so confirm by
  re-running or running the affected specs in isolation.

React Component guidelines
If we need to define any components that are not covered by the Stand component library we should:
Use React.FunctionComponent
We should define any props inline in the same file

For example

```Typescript
import type { SerializedStyles } from '@emotion/react';
import { css } from '@emotion/react';
import { palette } from '../styles/palette';

type BorderlessButtonProps = {
	onClick?: () => void;
	cssOverrides?: SerializedStyles;
	disabled?: boolean;
};

const buttonCss = css({
	display: 'flex',
	alignItems: 'center',
	// To stop display: 'flex' from causing
	// whitespace to collapse around inline elements
	// (e.g. <a> or <button>).
	whiteSpace: 'pre-wrap',
	border: 'none',
	cursor: 'pointer',
	background: 'transparent',
	'&:disabled': {
		cursor: 'not-allowed',
		color: palette.grey[53],
		svg: {
			path: {
				fill: palette.grey[53],
			},
		},
	},
});

const BorderlessButton: React.FunctionComponent<BorderlessButtonProps> = ({
	onClick = () => {
		// By default, do nothing on click.
		// Defaulting to an empty function body allows us to
		// use this optional param without a null check.
	},
	cssOverrides,
	disabled = false,
	children,
}) => {
	return (
		<button
			disabled={disabled}
			onClick={onClick}
			css={[buttonCss, cssOverrides]}
		>
			{children}
		</button>
	);
};

export { BorderlessButton };

```
