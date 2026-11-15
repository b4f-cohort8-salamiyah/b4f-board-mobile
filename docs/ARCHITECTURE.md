# B4F Board Mobile — Architecture

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | November 15, 2026 |
| Scope | App-wide architecture for V1 |
| Related | [`MOBILE_SCOPE.md`](./MOBILE_SCOPE.md), [`ROADMAP.md`](./ROADMAP.md), [`ENGINEERING_STANDARDS.md`](./ENGINEERING_STANDARDS.md), [`CAPABILITY_MATRIX.md`](./CAPABILITY_MATRIX.md) |

This document records durable, app-wide architecture decisions and the reasons for them. It does
not choose packages, list files for individual features, or define API contracts. Those decisions
are deliberately left to later stages (see [Deferred decisions](#deferred-decisions)). Read this
document before proposing any new structural pattern.

**Starting point.** The repository is the Expo SDK 58 template:

- routes in `src/app/`, with the root layout in `src/app/_layout.tsx`
- native tabs in `src/components/app-tabs.tsx`
- shared UI in `src/components/`, hooks in `src/hooks/`, the theme in `src/constants/theme.ts`
- `typedRoutes` enabled, strict TypeScript, and the `@/` import alias

---

## Durable architecture decisions

### 1. The backend is fixed

The app communicates only through the B4F Board backend's documented HTTP API. It never modifies,
extends, or works around the backend. When the backend cannot support something, the limitation
is documented (DoD 11 in [`PRODUCT_REQUIREMENTS_V1.md`](./PRODUCT_REQUIREMENTS_V1.md)). It is
never solved by changing the backend.

### 2. Navigation

- **Expo Router is the only navigation system.**
- **The root layout has a single guard** that separates the public area (sign-in only) from the
  protected area (everything else), using Expo Router's protected routes.
  - When the local session ends, through sign-out, expiry, or a 401, the guard alone moves the
    user to sign-in and discards protected history.
  - *Rationale:* one boundary, the pattern Expo Router documents, and no redirect logic scattered
    across screens.
- **The protected area has two tabs: My Issues (the default landing route) and Board.** These are
  the two V1 entry points. There are no tabs for POST-V1 areas such as notifications, activity,
  profile, or administration.
- **Issue detail, issue creation, and project-context selection sit above the tabs**, in the
  authenticated area, instead of belonging to one tab.
  - *Rationale:* issue detail is reached from both My Issues and the board, so it is not
    duplicated per tab.
- **Route groups** organize layouts without changing URLs. Route segment names are decided per
  slice.

### 3. Route params are validated at the route boundary

`typedRoutes` types route names, not the contents of parameters. Every screen validates its params
before using them, for example the format of an issue id
([`ENGINEERING_STANDARDS.md`](./ENGINEERING_STANDARDS.md) §5).

### 4. One typed API boundary

- A single API layer, outside `src/app/`, is the only code that:
  - performs HTTP requests
  - builds endpoint paths
  - attaches the credential
  - interprets HTTP status codes
- Screens, components, and feature hooks call its typed functions. They never call the network
  directly.
- **Only documented endpoints that are in scope are exposed.**
  - [`CAPABILITY_MATRIX.md`](./CAPABILITY_MATRIX.md) is the current evidence.
  - Each slice's exact endpoints and request/response contracts are recorded in
    `docs/API_CONTRACT.md` before the slice relies on them.
  - POST-V1 endpoints are not wrapped, even though the backend has them.
  - No endpoints are invented, and no undocumented response fields are relied on.
- **Typed edges:**
  - Contract types are defined once, in the API layer.
  - Enumerations are exact unions of the backend's values.
  - Nullable fields stay nullable.
  - Reads and writes keep separate types where the backend returns different shapes; for example,
    an issue read includes related objects, while an issue write returns the bare record.
- **Fetch implementation:** the boundary needs a standard Fetch-style API. The concrete
  implementation is deferred and stays local to the API layer.

### 5. Normalized API errors

Every failure reaches callers as one typed error. It carries the HTTP status, a category, and a
normalized list of messages; the backend sends `message` as either a string or an array of
strings.

| Category | Source |
| --- | --- |
| Unauthorized | 401 |
| Forbidden | 403 |
| Not found | 404, which also covers "not a member" |
| Validation | 400 |
| Server | 5xx and other unexpected responses |
| Network | No response received |

No caller interprets raw status codes or raw error bodies.

### 6. One configurable backend origin

- The backend origin is read from **one** configuration module, and only the API layer uses it.
- No feature, screen, or call site hard-codes `localhost`, a LAN IP, or any other origin.
- A missing or malformed origin fails loudly at startup rather than silently calling the wrong
  host.
- How the origin is supplied is deferred (see [Deferred decisions](#deferred-decisions)).

### 7. A single session owner

- One React context, provided from the root layout, owns the session:
  - its status: restoring, signed out, or signed in
  - the current user
  - the reason a session ended, for example expiry
- No other module holds or derives session state.
- The access token is kept only behind a **secure credential-persistence abstraction** with three
  operations: save, read, and delete. Only the session owner uses it.
- The token never appears in render state, props, logs, error messages, URLs, or analytics
  ([`ENGINEERING_STANDARDS.md`](./ENGINEERING_STANDARDS.md) §3).
- The API layer gets the token through a getter supplied by the session owner. It never reaches
  into persistence.
- The concrete persistence mechanism is deferred.

### 8. Session continuity (accepted human decision)

| Situation | Required behaviour |
| --- | --- |
| Normal app relaunch | **The credential persists** across normal relaunch, through the secure credential-persistence abstraction. |
| Startup with a stored credential | The credential is **validated with `GET /auth/me`** before any protected content is shown. The splash stays visible until the session status is known. |
| Validation returns 401 (authentication failure) | The local credential is **deleted** and the user is **signed out**. |
| Validation fails for a network or server reason | The stored credential is **kept**. A recoverable error state with retry is shown, and no protected content is shown, until validation succeeds or returns 401. |
| Any 401 during use | The API layer reports it to the session owner, which ends the local session the same way every time. Screens never handle 401 themselves. |
| Sign-out | A local action only: the credential is deleted and state is cleared. The UI never implies server-side revocation, because the backend has no logout or revocation. |
| Expiry detection | Driven by the backend's 401. The client does not decode tokens or run expiry timers. |

### 9. The UI is permission-aware; the backend has authority

- The UI offers only the actions a user's role and relationship to the issue permit. For issue
  edits, that is the assignee / reporter / OWNER / ADMIN rule, using the user's role from the
  workspace list.
- The backend remains the authority. Every write handles a forbidden response gracefully, even
  when the UI expected it to succeed.

### 10. Minimal global state

- App-wide state is limited to the **session** (§7).
- From M4, a narrowly scoped **project-context owner** inside the authenticated area holds the
  current workspace and project. The board and issue creation share it.
- Nothing else is global.
- There is no global state-management library and no server-cache library in V1. Either is
  revisited only for a demonstrated need, such as cross-screen cache invalidation, polling, or
  cross-screen request deduplication. Any library then goes through the dependency review in
  [`ENGINEERING_STANDARDS.md`](./ENGINEERING_STANDARDS.md) §9.

### 11. Remembered project context

- Only the project-context owner holds the remembered context.
- It contains only the last-used workspace and project identifiers. These are non-sensitive local
  context, not a credential.
- It is always revalidated against the API before use, using the workspace list and that
  workspace's project list.
- If revalidation fails, the context is quietly discarded, never shown as still accessible, and
  the user chooses again.
- It is stored separately from the credential. Its storage mechanism is decided on its own merits
  and does not automatically share the credential mechanism.
- No recently-viewed, pinned, or history features are introduced.

### 12. Server data is local and refreshable

- Feature hooks own screen data as local state.
- That data is a copy of the server: refreshed on screen focus and pull-to-refresh, tolerant of
  responses that arrive out of order, and free of duplicate requests while one is in flight.
- After a successful write, the affected resource is read again, because write responses may have
  a different shape from read responses.
- V1 has no optimistic updates.
- Shared fetch-state logic moves into `src/hooks/` once a third screen repeats the same pattern
  ([`ENGINEERING_STANDARDS.md`](./ENGINEERING_STANDARDS.md) §11).

### 13. Screen state rules

- Every data screen renders exactly one of: loading, error, empty, or content.
- Every write moves from idle to pending, then to failed or succeeded. Its controls are disabled
  while it is pending.
- Errors are shown by category, the same way everywhere:

| Category | Shown as |
| --- | --- |
| Unauthorized | Never shown on a screen; the session ends (§8). |
| Forbidden | A permission message; the displayed data stays unchanged. |
| Not found | A not-found state. This also covers loss of workspace membership. |
| Validation | Messages next to the related fields; the user's input is preserved. |
| Network or server | An error state with a retry. |

- An empty result is never presented as an error.
- After a failed write, the screen still matches the server's state.
- State-presentation components live in the existing `src/components/` and are built on the
  existing themed primitives. Each is extracted once a second feature needs it.

### 14. Module layers and dependency direction

| Layer | Location | Responsibility |
| --- | --- | --- |
| Routes | `src/app/` | Assemble screens, validate params, and navigate. No business logic, network access, or reusable UI. |
| Features | `src/features/<feature>/` | One folder per V1 feature area: auth, My Issues, issues, comments and mentions, board, project context. Each owns its components, hooks, and pure domain logic. |
| API layer | A dedicated folder outside `src/app/` | HTTP, contract types, and error normalization. No React, persistence, or UI. |
| Configuration | A dedicated module | Build-time configuration, including the backend origin. The only reader of environment configuration. |
| Shared | `src/components/`, `src/hooks/`, `src/constants/` | Only what two or more features use. |

- Dependencies flow one way: routes → features → API layer, shared UI, hooks, constants. The API
  layer depends only on configuration.
- Features never import each other's internals. A feature that needs another's logic goes through
  that feature's single public entry point; for example, the board uses the issue permission rule
  and the status change.

### 15. Pure domain logic stays outside components

Permission rules, board grouping and per-status counts, mention formatting and parsing, and My
Issues ordering (once the product decides it) are pure functions. This keeps them directly
unit-testable without UI.

### 16. Deterministic enforcement

- Lint and type checks (`npx tsc --noEmit`) gate every change. Pure logic is covered by tests.
- Lint enforces the API-boundary rules:
  - no network access outside the API layer
  - no environment access outside configuration
  - no hard-coded origins
- The API layer must be replaceable in tests.

### 17. Slice-driven API contract verification

- A slice must not rely on an API contract that has not been verified to the level that slice
  needs.
- Source inspection (`CAPABILITY_MATRIX.md`) is the initial contract evidence.
- Runtime verification of the contracts a slice uses happens before or during delivery of that
  slice.
- If runtime behaviour differs from the documented contract, the contract and evidence are updated
  before implementation continues to rely on the wrong assumption.
- Mocked tests never replace verification against the real backend.

### 18. Device verification

- Each milestone is verified against the real backend in the iOS simulator.
- Validation on a physical iPhone is required before V1 is considered complete, and for any
  milestone that depends on device-only behaviour.

### 19. Web is not a V1 target

- The template's existing web files stay untouched and unsupported.
- *Rationale:*
  - the fixed backend's CORS policy allows only the web app's origin
  - a web build would put the credential at risk under
    [`ENGINEERING_STANDARDS.md`](./ENGINEERING_STANDARDS.md) §3

---

## Deferred decisions

These are intentionally not decided here.

**API contract work (`docs/API_CONTRACT.md`)**

- The exact endpoints, request/response shapes, and error cases for each slice.
- Their runtime-verified behaviour, established per slice, including null handling and
  differences between read and write shapes.

**First-slice implementation planning**

- The exact files, folder names, and route segment names for M1, and the list of template demo
  files to remove.
- How the API layer's internal modules are split.
- Where sign-out appears in the UI.
- How the backend origin is supplied. The recommendation (Expo public build-time environment
  variables with a git-ignored local file) needs human acceptance.
- Whether iOS transport-security settings allow HTTP to the local development backend. If not,
  this is resolved by configuration and recorded as a decision.

**Secure-persistence dependency selection**

- The concrete mechanism behind the secure credential-persistence abstraction. It goes through
  dependency discovery, the four-question review in
  [`ENGINEERING_STANDARDS.md`](./ENGINEERING_STANDARDS.md) §9, and human approval.

**Later local-context storage decision (M4)**

- The storage mechanism for the remembered workspace/project context. It is decided on its own
  merits as non-sensitive data and need not share the credential mechanism.

**Test and tooling dependency decisions**

- Which Fetch implementation sits behind the API boundary.
- The lint configuration and rule packages.
- The test runner and its presets.
- Each goes through the four-question review and human approval when the first slice needs it.

---

## Process and document reconciliation items

- **`ROADMAP.md` Milestone 0 versus slice-driven verification (§17).**
  - Milestone 0 currently reads as exhaustive, V1-wide runtime API verification before Milestone 1
    begins. Its goal says "before any feature work", its scope covers "every V1 capability", and its
    completion gate requires a full verification record.
  - The milestone needs reconciling with slice-driven verification.
  - `ROADMAP.md` is not changed by this document.
