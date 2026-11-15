# Slice 01 — Foundation (M1): Implementation Plan

| Field | Value |
| --- | --- |
| Slice | M1 foundation (`docs/ROADMAP.md`, Milestone 1) |
| Governing architecture | [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) |
| API contract | [`docs/API_CONTRACT.md`](../docs/API_CONTRACT.md) |
| Standards | [`docs/ENGINEERING_STANDARDS.md`](../docs/ENGINEERING_STANDARDS.md) |
| Status | Accepted plan; implementation not started |

## Scope

**In scope:**

- login
- session persistence across relaunch
- session restoration
- My Issues
- read-only issue detail

**Endpoints:** only the four in `docs/API_CONTRACT.md`:

- `POST /auth/login`
- `GET /auth/me`
- `GET /users/me/issues`
- `GET /issues/:id`

**Out of scope:**

- status changes, `PATCH`, `myRole`
- the Board tab
- comments
- issue creation
- any later-slice or POST-V1 capability
- any backend change

## Unresolved dependency decisions (not selected by this plan)

| Decision | Required by | Effect on this slice |
| --- | --- | --- |
| Secure credential-persistence mechanism | `ARCHITECTURE.md` §7–8 | Decided in its own secure-persistence dependency decision. This plan defines only the abstraction, its interface, callers, and verification. **No storage package is selected or assumed.** The slice cannot be completed until the decision is approved and implemented. |
| Unit-test runner | `ARCHITECTURE.md` §16 ("pure logic is covered by tests"). Pure-logic tests are required for this slice. | Decided in its own dependency decision. **No runner is selected or installed by this plan.** The required tests are listed below and run once a runner is approved. |

## Accepted slice-level decisions

- **Origin configuration.**
  - `src/config/env.ts` is the single configuration module (`ARCHITECTURE.md` §6) and the only
    reader of `process.env`.
  - It reads `process.env.EXPO_PUBLIC_API_BASE_URL` with literal dot access.
  - It validates that the value is an absolute `http(s)` URL with no trailing slash, and fails at
    startup otherwise.
  - Values come from a git-ignored `.env.local` (`.gitignore` already covers `.env*.local`), with a
    committed `.env.example`.
  - The value is public in the bundle and never holds a secret.
- **Lint gate.**
  - Required by `ENGINEERING_STANDARDS.md` §12 and `ARCHITECTURE.md` §16, through the existing
    `"lint": "expo lint"` script.
  - The packages Expo installs on its first run get the §9 four-question review when lint is set
    up during implementation.
  - The API-boundary rules use ESLint core rules only:
    - `no-restricted-globals` for `fetch` outside `src/api/client.ts`
    - `no-restricted-properties` for `process.env` outside `src/config/env.ts`
    - `no-restricted-syntax` for `http(s)://` string literals outside `src/config/`
- **Fetch.** The global `fetch`. No package.
- **Navigation.** Follows `ARCHITECTURE.md` §2. No new navigation decision.
- **Template cleanup.** Minimal, with a stop condition (piece 8).

## Navigation structure

```
src/app/_layout.tsx                 (existing, changed) providers, root Stack, guards, splash
src/app/sign-in.tsx                 (new) public
src/app/reconnect.tsx               (new) startup validation failed for a network or server reason
src/app/(app)/_layout.tsx           (new) authenticated Stack: the tabs, plus screens above them
src/app/(app)/(tabs)/_layout.tsx    (new) tabs, using the existing src/components/app-tabs.tsx
src/app/(app)/(tabs)/index.tsx      (new) My Issues tab, the landing route "/"
src/app/(app)/issues/[issueId].tsx  (new) read-only issue detail, pushed above the tabs
```

- `src/components/app-tabs.tsx` (existing) is reworked to declare the My Issues trigger, reusing
  the existing tab icon asset.
- The Board trigger is added in M4.
- Sign-out is a control on the My Issues screen.

## Pieces

### 0. Runtime contract verification (no app code)

- **What:** run the existing backend locally, unmodified, and call the four endpoints with the
  seeded accounts.
- **What to record:**
  - each success shape
  - the 401 for invalid credentials
  - `/auth/me` with a garbage token
  - a non-UUID `:id`
  - "Issue not found" versus "Workspace not found"
  - the date format
- **Where results go:** outcomes are recorded in `docs/API_CONTRACT.md` §7. The contract is
  corrected first if anything differs (`ARCHITECTURE.md` §17).
- **Real 8-hour expiry:** stays unconfirmed in M1 unless decided otherwise. A forced 401 (garbage
  token) exercises the handling.
- **Verify:** every §7 item has an outcome, and the backend's `git status` is clean.

### 1. Lint gate

- **Files:** the ESLint configuration produced by `npx expo lint`, plus the three core boundary
  rules above.
- **Endpoint:** none.
- **Verify:**
  - a `fetch` or `process.env` placed in a screen makes lint fail
  - the clean tree passes `npx expo lint`

### 2. Configuration

- **Files:** `src/config/env.ts`, `.env.example` (new); `.env.local` (per developer, git-ignored).
- **Endpoint:** none.
- **Verify:**
  - the app fails clearly when the variable is unset or malformed
  - **required test:** the validator rejects missing, relative, and trailing-slash values

### 3. API layer (the only network boundary)

- **Files (all new):**
  - `src/api/client.ts`
    - the only `fetch` call and the only importer of `src/config/env.ts`
    - joins origin and path, encodes JSON, applies a timeout
    - adds the Bearer header through a token getter registered by the session owner
    - calls a registered `onUnauthorized` handler on any 401
  - `src/api/errors.ts`: `ApiError` plus a pure normalizer
    - categories: unauthorized, forbidden, notFound, validation, server, network
    - normalizes `message` to `string[]`
  - `src/api/types.ts`, matching `API_CONTRACT.md` exactly:
    - `IssueFields`
    - `MyIssue` (with `project`)
    - `IssueDetail` (with nullable `assignee` and `reporter`, plus `project` and `_count`)
    - `LoginResponse`
    - `CurrentUser`
    - the status and priority unions
  - `src/api/auth.ts`: `login` → `POST /auth/login`; `getCurrentUser` → `GET /auth/me`
  - `src/api/issues.ts`: `getMyIssues` → `GET /users/me/issues`; `getIssue` → `GET /issues/:id`
- **Rules:** no React, persistence, or UI in this layer. No endpoint beyond these four.
- **Verify:**
  - runtime results from piece 0
  - lint confirms the boundary
  - **required tests:**
    - every error category, including a string versus an array `message`
    - both 404 messages map to notFound
    - the client attaches the Bearer header and calls `onUnauthorized` on a 401, with the network
      replaced

### 4. Secure credential-persistence abstraction

- **File:** `src/features/auth/credential-store.ts` (new).
- **Responsibility:**
  - the `ARCHITECTURE.md` §7 abstraction, and the only module that will touch the persistence
    mechanism
- **Interface:**
  - `saveCredential(token)`
  - `readCredential()`, which returns the token or nothing
  - `deleteCredential()`
- **Callers:** only `session-provider.tsx`.
- **Mechanism: unresolved.** Implemented only after the secure-persistence dependency decision is
  approved. No package is assumed.
- **Endpoint:** none.
- **Verify, after the mechanism is approved and implemented:**
  - a login survives app relaunch in the simulator
  - sign-out removes the stored credential
  - nothing outside this file imports the mechanism
  - the token never appears in logs, state, props, or URLs (`ENGINEERING_STANDARDS.md` §3)

### 5. Session owner, root guards, sign-in, and reconnect

- **Files:**
  - `src/features/auth/session-state.ts` (new): a pure state machine with the states
    `restoring`, `restoreFailed`, `signedOut`, `signedIn`, plus `endReason`
  - `src/features/auth/session-provider.tsx` (new): the single session owner
    - **startup:** `readCredential`, then `getCurrentUser`
      - 200 → `signedIn`
      - 401 → `deleteCredential`, then `signedOut`
      - network or server failure → `restoreFailed`, with the credential **kept** and a `retry()`
        available (`ARCHITECTURE.md` §8)
    - **sign-in:** `login`, then `saveCredential`, then `signedIn`
    - **sign-out:** `deleteCredential`, then `signedOut` (local only)
    - registers the token getter and `onUnauthorized` (→ `signedOut`, `endReason: 'expired'`) with
      the client
    - the token is held in a ref, never in render state
  - `src/features/auth/index.ts` (new): the public entry point (`SessionProvider`, `useSession`)
  - `src/features/auth/sign-in-screen.tsx`, `session-retry-screen.tsx` (new): built on the
    existing `themed-text` and `themed-view`
  - `src/app/_layout.tsx` (existing, changed):
    - `SessionProvider`
    - a root `Stack` with `Stack.Protected` guards: signed in → `(app)`; signed out → `sign-in`;
      restore failed → `reconnect`
    - keeps `SplashScreen.preventAutoHideAsync()` and hides the splash when the status leaves
      `restoring`
    - removes the `AnimatedSplashOverlay` usage, which hides the native splash immediately on
      layout
  - `src/app/sign-in.tsx`, `src/app/reconnect.tsx` (new): thin routes
- **Endpoints:** `POST /auth/login`, `GET /auth/me`.
- **Verify in the simulator:**
  - a valid login works; an invalid login shows the 401 message
  - relaunch lands on My Issues
  - relaunch with the backend stopped shows the retry screen without signing out, and retrying
    after a restart reaches My Issues
  - a garbage stored token leads to sign-in with an "expired" message
  - after sign-out, protected routes are unreachable
  - **required test:** every state transition, including "a network failure keeps the credential"

### 6. My Issues

- **Files:**
  - `src/app/(app)/(tabs)/index.tsx` (new, a thin route)
  - `src/features/my-issues/my-issues-screen.tsx`, `use-my-issues.ts`, `issue-row.tsx` (new)
    - local state
    - fetch on focus and on pull-to-refresh; ignore stale responses; no duplicate in-flight
      request
    - each row shows key, title, status, priority, and project name
    - rows appear in the server's `updatedAt` desc order as the interim order
    - the sign-out control
  - `src/components/screen-state.tsx` (new, shared): loading, error with retry, empty, not-found.
    It is shared because two features in this slice use it.
- **Endpoint:** `GET /users/me/issues`.
- **Verify in the simulator, with the M0 accounts:**
  - every returned issue is shown
  - an account with no issues sees the empty state
  - with the backend stopped, the error state appears with a retry
  - tapping a row opens the detail view

### 7. Read-only issue detail

- **Files:**
  - `src/app/(app)/issues/[issueId].tsx` (new): validates `issueId` before any request
  - `src/features/issues/issue-id.ts` (new): a pure UUID check
  - `src/features/issues/issue-detail-screen.tsx`, `use-issue.ts`, `index.ts` (new)
- **What it shows:**
  - key, title, description, status, priority, project, and comment count
  - assignee and reporter, with null shown clearly
  - story points, with null distinguished from 0
- **Not found:** both 404 messages show the same not-found state.
- **Endpoint:** `GET /issues/:id`.
- **Verify in the simulator:**
  - your own issue renders in full
  - a non-member's issue shows not-found
  - a random UUID shows not-found
  - an invalid param shows not-found with no request sent
  - **required test:** `issue-id.ts`

### 8. Minimal template cleanup

- **Deleted:** the native demo files, used only by the demo screens:
  - `src/app/explore.tsx`
  - `src/app/index.tsx` (replaced by `(app)/(tabs)/index.tsx`)
  - `src/components/hint-row.tsx`, `web-badge.tsx`, `ui/collapsible.tsx`
- **Kept untouched**, because they are web files (`ARCHITECTURE.md` §19) or used by them:
  - `app-tabs.web.tsx`
  - `external-link.tsx`
  - the `animated-icon` files (`animated-icon.tsx`, `animated-icon.web.tsx`,
    `animated-icon.module.css`); only their import in `_layout.tsx` is removed
- **Stop condition:** if `typedRoutes` makes `tsc` fail because `app-tabs.web.tsx` links to the
  deleted `/explore`, **stop and ask**. Fixing it would change a web file that §19 keeps
  untouched.

## Base origin, per piece

| Piece | Reads the origin? |
| --- | --- |
| 2 `src/config/env.ts` | Owns it |
| 3 `src/api/client.ts` | The **only** importer |
| 3 `auth.ts`, `issues.ts` | No. They pass paths only, through `client.ts`. |
| 4–8 | Never. They use `src/api` functions or the session context. Lint enforces this. |

## Completion gate

- `npx expo lint` and `npx tsc --noEmit` pass.
- All **required tests** pass on the approved unit-test runner.
- Session persistence works through the approved secure-persistence mechanism.
- Every `docs/ROADMAP.md` M1 acceptance criterion is demonstrated in the iOS simulator against the
  real local backend, with the M0 test accounts.
- `docs/API_CONTRACT.md` §7 outcomes are recorded.
- The backend repository is unchanged.
- If iOS transport security blocks plain HTTP to the local backend, it is resolved by
  configuration and recorded as a decision, never by a backend change.
