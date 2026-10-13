# Specification: Migrating a mediator/SWR frontend to Redux Toolkit + RTK Query

A reusable, project-agnostic playbook for replacing an event-bus (`mediator-js`
or similar pub/sub) and SWR-style data fetching with Redux Toolkit (RTK) and RTK
Query. It generalises the migration first applied to `flexible-restorer` (a
hybrid AngularJS + React app mid-strangler-migration). Follow the decisions and
steps below; the "Rationale" notes explain _why_ so you can adapt them.

## When this applies

- A React (or hybrid) frontend uses a global pub/sub bus (`mediator`, an event
  emitter, custom `window` events) to share UI state between components that
  don't have a common ancestor.
- Data fetching/caching is done with SWR (or React Query, or ad-hoc memoised
  promises).
- You want a single, testable, typed source of truth for shared UI state and
  server cache.

## Target architecture

1. **One RTK store**, created as a module-level singleton.
2. **RTK Query** (`createApi`) for all server interactions — one endpoint per
   request, replacing SWR hooks and ad-hoc fetch helpers. When the calls span
   multiple backend services, split them into one `createApi` per service (each
   with its own `reducerPath`) so it is obvious which service a call hits.
3. **A UI slice** (`createSlice`) holding the shared UI state that previously
   travelled over the event bus (selections, view toggles, open/close flags,
   errors).
4. **Typed hooks and encapsulated selector hooks.** Expose typed
   `useAppDispatch`/`useAppSelector`, but wrap each selector in its own hook
   (`useIsModalOpen()` rather than `useAppSelector(selectIsModalOpen)`) so
   components read state through intention-revealing hooks and never touch
   `useAppSelector` or the state shape directly.

```
store/
  store.ts        # configureStore singleton (registers every api) + RootState/AppDispatch
  <service>Api.ts # one createApi per backend service (e.g. restorerApi, flexibleApi)
  apiError.ts     # shared error type + normaliser reused by each service api
  <feature>Slice.ts  # shared UI state + actions + selectors
  hooks.ts        # typed useAppDispatch + one hook per selector (useIsModalOpen, ...)
  withStore.tsx   # <Provider> HOC (needed when there are multiple React roots)
```


## Key decisions (made once, reused)

### D1. Retire event-bus round-trips; make state directly shared

If the bus was used to bounce state between components (A publishes → B reacts →
B publishes → C reacts), collapse it: put the state in the store and let every
component read it directly. Remove any intermediary (including legacy controllers
in a hybrid app) whose only job was to relay events. **Do not** re-implement the
bus on top of Redux.

_Rationale:_ the bus's main value was decoupled cross-tree communication, which
is exactly what a store selector provides — but with a single source of truth,
time-travel debugging and testability.

### D2. All server calls go through RTK Query

Move every fetch (lists, items, current user, look-ups, and POST/PUT/DELETE as
mutations) into `createApi` endpoints. Prefer wrapping existing, well-tested
fetch helpers via `queryFn` over rewriting them with `fetchBaseQuery`.

_Rationale:_ `queryFn` preserves the existing request options, URL builders,
error contracts and any memoisation, so the migration is behaviour-preserving;
RTK Query only adds caching, deduplication and hook state on top.

### D3. Parse on ingress; decide where non-serialisable values live

Parse each response into its view model **on ingress** — in the endpoint's
`queryFn` (or `transformResponse`) — so parsing happens once per cache entry and
every consumer shares a single parsed reference (this also lets you delete the
thin `useX` wrapper hooks and call the generated `useGetXQuery` directly).

The catch: RTK stores query results (and args) in Redux state, which RTK's
`serializableCheck` expects to be serialisable. If your view model contains
non-serialisable values (`moment`/`Date`/`Map`/class instances), pick one:

- **Parse on ingress + widen the check (chosen here).** Keep the rich view model
  and tell the store it is acceptable, e.g.
  `serializableCheck: { isSerializable: (v) => moment.isMoment(v) || isPlain(v) }`.
  Simplest for consumers; the tradeoff is a non-plain value in the store (fine as
  long as you never rely on strict serialisation/persistence).
- **Parse on ingress into serialisable shapes.** Convert dates to ISO strings in
  the endpoint and re-hydrate (`moment(str)`) at the edge. Keeps the store fully
  serialisable at the cost of a mapping layer.
- **Return raw + parse in a hook `useMemo`.** Keeps the store serialisable
  without config, but re-parses per consumer and reintroduces a wrapper hook.

_Rationale:_ parsing on ingress is the cleanest for callers and matches "parse at
the boundary". Storing a `moment` is a deliberate, contained tradeoff; if strict
serialisability matters (persistence, time-travel across reloads), prefer the
ISO-string variant.

### D4. One shared store across multiple React roots

If the app mounts several independent React roots (e.g. `react2angular`,
micro-frontends, multiple `createRoot` calls), export the store as a module
singleton and wrap **every** root in the same `<Provider store={store}>` (a small
`withStore` HOC keeps registration tidy). Do not create a store per root.

_Rationale:_ separate `<Provider>`s with separate stores cannot share state; a
singleton store shared by all roots behaves as one app.

### D5. Errors: normalise to a serialisable message, dispatch at the edge

Give the UI slice an `error` field holding a **string** (or a small serialisable
object). Provide a `setError` action with a `prepare` callback that normalises
any thrown value/RTK Query error into a message. Each hook dispatches `setError`
when its query/mutation reports an error. Preserve any pre-existing "swallow this
error" behaviour rather than surfacing new errors during the migration.

_Rationale:_ keeps error state serialisable and centralises display, while a
per-hook dispatch mirrors the old explicit "publish error" call sites and avoids
surprising behaviour changes.

### D6. Drop dead channels

Audit the bus for events that are published but never subscribed (common with
analytics). Remove them rather than porting them.

### D7. Push derivation out of components: ingress first, then selectors

Move memoisation logic in components to selectors if possible, or even better, on
ingress as we get data from the API. Prefer this order when a component derives a
value from fetched/store data:

1. **On ingress** (endpoint `queryFn`/`transformResponse`) — best when the
   derived shape is a pure function of a single response and every consumer wants
   it the same way (e.g. sorting/parsing a list). Computed once per cache entry,
   shared by all consumers, and it deletes per-component `useMemo`s (D3).
2. **In a selector** — best when the value derives from store state (possibly
   combining slices/args) or needs per-caller inputs. Use a memoised selector
   (`createSelector`) so it recomputes only when its inputs change, and it stays
   unit-testable in isolation.
3. **In a component `useMemo`** — last resort, only for values that are genuinely
   local (depend on props/local state that never belong in the store).

_Rationale:_ derivation nearest the data source runs the fewest times, is shared,
and keeps components thin and presentational. A component `useMemo` recomputes per
component instance and hides reusable logic inside the view layer.

_Caveat:_ don't force a derivation onto ingress if it needs inputs the endpoint
doesn't have (e.g. the current user's permissions, or a per-component selection) —
that belongs in a selector or the consuming hook instead.

## Mapping cheat-sheet

| Old (mediator / SWR)                         | New (RTK / RTK Query)                                  |
| -------------------------------------------- | ----------------------------------------------------- |
| `publish('select', i)` / `subscribe('select')` | `dispatch(setActiveIndex(i))` / `useAppSelector(selectActiveIndex)` |
| `publish('showX')` / `subscribe('showX')`    | `dispatch(showX())` / selector on the slice           |
| `publish('openModal')` / `'closeModal'`      | `dispatch(openModal())` / `dispatch(closeModal())`    |
| `publish('error', e)` / `subscribe('error')` | `dispatch(setError(e))` / `useAppSelector(selectError)` |
| `useSWR(key, fetcher)`                        | `useGetXQuery(arg)` (endpoint wraps + parses the fetcher) |
| conditional SWR key (`key ? … : null`)       | `useGetXQuery(arg ?? skipToken)`                       |
| parsing in an SWR fetcher / wrapper hook      | parse in the endpoint `queryFn` (D3); drop the wrapper |
| memoised POST helper                          | `useXMutation()` + `.unwrap()`                         |
| bus relay component / controller             | delete; components read the store directly            |

## Step-by-step

1. **Inventory.** List every bus channel (publishers + subscribers) and every
   data fetch. Note which channels are React↔React vs. cross-framework, and which
   are dead (D6).
2. **Dependencies.** Add `@reduxjs/toolkit` and `react-redux`. For tests add a
   DOM environment (`jsdom`) and React Testing Library, and ensure the test
   transform handles JSX/TSX and stubs asset imports (svg/css) via
   `moduleNameMapper`.
3. **Store scaffolding.** Create `store.ts` (singleton + types), `hooks.ts`
   (typed hooks + selectors), and — if there are multiple roots — `withStore.tsx`
   (D4). Call `setupListeners(store.dispatch)` for RTK Query focus/reconnect.
4. **RTK Query service api(s).** One endpoint per request, each wrapping the
   existing fetch helper in `queryFn` and parsing on ingress (D2, D3). Group
   endpoints into one `createApi` per backend service (`<service>Api.ts`) and
   register every api's reducer + middleware in the store. Export the generated
   hooks. If parsed models hold non-serialisable values, widen the store's
   `serializableCheck` accordingly (D3).
5. **UI slice.** Model the shared state the bus carried; add actions and
   selectors, including `setError`/`clearError` (D5).
6. **Wire the provider(s).** Wrap each React root with the shared store (D4).
7. **Migrate consumers.** Call the generated `useGetXQuery` hooks directly
   (parsing already done on ingress, D3), replace `publish` with `dispatch`,
   replace `subscribe` with selectors, and dispatch `setError` on query errors.
8. **Retire relays.** Delete intermediary controllers/components and the bus
   wrapper once nothing imports them (D1).
9. **Remove dead deps.** Uninstall the bus library and SWR; delete their files;
   grep to confirm no imports remain.
10. **Tests.** Add unit tests for the slice reducers, at least one RTK Query
    endpoint (mock `fetch`), and RTL tests for the key state-driven components
    (render with a real store + `<Provider>`, assert state after interaction).
11. **Verify.** Type-check (strict), run unit tests, run the production build
    (so the bundle compiles without the removed modules), then run the e2e suite.

## Gotchas learned in practice

- **`skipToken`** (from `@reduxjs/toolkit/query/react`) is the RTK Query
  equivalent of SWR's "null key" — use it to defer a query until its argument is
  ready or a modal is open.
- **Stable query args for memoised effects.** Deriving a query arg object inline
  gives it a new identity each render; wrap derivations in `useMemo` before using
  them as effect dependencies (or the fade/loading effects re-fire every render).
- **Generic `<Provider>` HOC + JSX spread** can trip strict TS
  (`LibraryManagedAttributes`); render the wrapped component with
  `createElement(Component, props)` inside the JSX `<Provider>` to sidestep it.
- **Serializability check** flags any rich object (e.g. `moment`) that lands in
  the store or query args. Decide deliberately (D3): widen `isSerializable`,
  store ISO strings, or return raw and parse in a hook.
- **Test transform gaps.** A build that relies on webpack asset loaders needs a
  jest `moduleNameMapper` stub for `svg/png/css/scss`, plus the JSX runtime in
  the babel preset, before component tests will import cleanly.
- **Preserve existing error UX.** If a screen previously swallowed a fetch
  failure (showed empty state rather than an error dialog), keep doing so; only
  route errors that were previously surfaced through the new `setError` path.
