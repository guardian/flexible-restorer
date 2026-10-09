# Restorer

Restores snapshotted content back into Composer. The snapshotting itself is taken care of in [flexible-snapshotter](https://github.com/guardian/flexible-snapshotter).

## Before running locally

### Set up

### Install client-side dependencies and build JS/CSS

Tool versions (Node, Java, sbt, Scala) are pinned in `.tool-versions` and managed
with [mise](https://mise.jdx.dev). Install them once with `mise install`, then:

Run `./scripts/setup`.

```
$ npm ci
$ npm run build

# Alternatively to continuously watch for changes and rebuild
$ npm run watch
```

The frontend uses React, strict TypeScript, Guardian Stand, Emotion, Redux Toolkit
and RTK Query. Vite builds `public/dist/main.js` and `public/dist/main.css`, which
Play serves through the existing asset routes. Watch mode rebuilds those assets;
reload the authenticated Play page after changes.

For Vite's development server with React hot updates, run `npm run dev`. It serves
the frontend at <http://localhost:5173> and proxies `/api` and `/export` to Play at
`http://localhost:9000`. This does not bypass authentication: the browser still
needs an applicable authenticated session. Use the normal HTTPS Play URL and
`npm run watch` when working with domain-scoped Panda cookies.

### Get credentials

- Get [Composer credentials from Janus](https://janus.gutools.co.uk/credentials?permissionId=composer-dev)
- Make sure you have `restore_content` permission on [CODE environment](https://permissions.code.dev-gutools.co.uk/admin)
- Log in to [CODE Workflow](https://workflow.code.dev-gutools.co.uk/dashboard)

## Start the app

```
$ sbt
[restorer] $ run
```

The app will then be accessible locally at: <https://restorer.local.dev-gutools.co.uk/>

## Verification

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
sbt compile test
```

The Playwright suite starts its own Vite server on port 5175 and checks desktop
and mobile workflows. All API requests, restore POSTs, telemetry and Composer
redirect destinations are intercepted in the tests. No credentials or real
restores are required. This verifies frontend contracts, not a live Panda/Composer
integration. Production bundle compilation and Scala tests are separate gates.

Run an individual browser scenario with
`npm run test:e2e -- --grep "requires confirmations" --project=desktop`.
This branch does not define the `mise run test:e2e` task mentioned in the original
RFC; use the npm command above. CI runs the unit tests, strict production build
and browser tests before packaging the application.

## Frontend Structure

- `public/javascripts/components`: React views with co-located Emotion styles.
- `public/javascripts/models.ts`: response parsing, HTML sanitization and serializable view models.
- `public/javascripts/store/restorerApi.ts`: all application JSON requests and the restore mutation.
- `public/javascripts/store/uiSlice.ts`: cross-component selection, preview mode, modal and error state.
- `public/javascripts/store/featureFlags.ts`: server defaults and persisted user overrides.

The header's **Feature flags** dialog controls the compact snapshot list.
Play writes `restorer-feature-defaults` on both application routes. User choices
are stored separately in `restorer-feature-overrides`; **Use server defaults**
clears those choices. Flags never grant permissions, and restore authorization
continues to be enforced by Play.

Reusable decisions and the branch-specific migration inventory are recorded in
[the Redux migration specification](rfc/redux-migration-spec.md).
