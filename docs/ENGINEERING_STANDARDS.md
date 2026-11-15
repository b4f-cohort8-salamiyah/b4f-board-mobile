# B4F Board Mobile — Engineering Standards

| Field | Value |
| --- | --- |
| Status | Accepted — v0.1 |
| Applies to | All code, configuration, and dependencies in this repository |
| Related | [`PRODUCT_REQUIREMENTS_V1.md`](./PRODUCT_REQUIREMENTS_V1.md), [`CAPABILITY_MATRIX.md`](./CAPABILITY_MATRIX.md), [`MOBILE_SCOPE.md`](./MOBILE_SCOPE.md), [`ROADMAP.md`](./ROADMAP.md) |

**MUST** means required. **SHOULD** means the default; a deviation needs a written reason in the
pull request or the decision log (§15).

These standards do not choose libraries. Where a choice is needed, for example secure token
storage, test tooling, or state management, the choice is recorded as a decision rather than
assumed here.

---

## 1. The Fixed Backend

- The B4F Board NestJS backend is **fixed. This app never modifies it.** The app never asks for,
  depends on, or works around backend changes.
- No new endpoints, no changed API behaviour, and no backend code, configuration, or database
  changes. This holds even when a backend change would make the mobile work easier.
- When the backend cannot support something, the limitation **MUST** be documented (DoD 11 in
  `PRODUCT_REQUIREMENTS_V1.md`) and taken back to product. It is never solved by changing the
  backend.

## 2. The API Boundary

- The app talks **only** to the backend's documented HTTP API. Every endpoint it calls **MUST**
  appear in `CAPABILITY_MATRIX.md`.
- **Never:**
  - connect to a database
  - call an invented, guessed, or undocumented endpoint
  - rely on response fields the matrix does not describe
  - call the Next.js web app's server as if it were an API
- All HTTP calls **MUST** go through one API layer, outside `src/app/`. Screens and components
  never build URLs or call the network directly.
- The API layer handles the backend's real behaviour:
  - Bearer authentication
  - the error shape `{ statusCode, message, error, path, timestamp }`, where `message` may be a
    string **or** a string array
  - 401 means the session has ended
  - 403 means not permitted
  - 404 can also mean "not a member"
  - 400 is a validation error
- Values the app works out from API data (counts, grouping, local sorting) are fine and expected.
  They **MUST NOT** be presented as data the server provided.
- If runtime behaviour differs from the matrix, update the matrix first, then the code.

## 3. Auth and Session Material

- The access token **MUST** be kept only in the platform's secure, encrypted storage, such as the
  iOS Keychain. The mechanism used is recorded as a decision. The token **MUST NOT** be kept in
  plain storage, files, source code, or global state that is saved to disk in plain form.
- Tokens, passwords, `Authorization` headers, and full auth request or response bodies **MUST
  NEVER** appear in:
  - logs, including `console.*`
  - error messages
  - crash or analytics payloads
  - URLs or route params
  - screenshots in documentation
- Signing out **MUST** delete the token from the device. The code and the UI **MUST NOT** suggest
  that the server has revoked it. The API has no logout, and the token stays valid until it
  expires (8 hours).
- Any 401 **MUST** end the session on the device and return the user to login with an
  explanation. No protected data may stay visible afterwards.
- Passwords **MUST NOT** be kept after the request that uses them.

## 4. Secrets and Configuration

- **Anything compiled into the app is public.** No secrets in source code, `app.json`,
  environment values bundled into the app, or committed `.env` files.
- The API base URL is configuration, not a constant hard-coded in features.
- Traffic outside local development **MUST** use HTTPS.

## 5. Typed Boundaries

- TypeScript `strict` stays on. Untyped values (`any`, `@ts-ignore`, unchecked `as` casts) **MUST
  NOT** cross a boundary without a comment explaining why.
- **API edge:**
  - Request and response types come from the documented contracts.
  - Enums are typed as exact unions of the backend values, for example status
    `TODO | IN_PROGRESS | REVIEW | DONE`.
  - Nullable fields stay nullable in the types. The assignee, reporter, and comment author can be
    null.
- **Different shapes stay different types.** For example, an issue from `GET /issues/:id`
  includes its related objects, while one returned by `POST` or `PATCH` is the bare issue. The two
  **MUST NOT** be merged into one optimistic type.
- **Other edges:** route params, deep links, and data saved on the device are untrusted strings.
  They **MUST** be checked before use, for example that an id is a UUID.
- Types for data from outside the app **SHOULD** be defined once, in the layer that owns that edge,
  and imported from there.

## 6. Loading, Error, and Empty States

- Every screen and every data change **MUST** handle loading, success, and error states. Lists
  **MUST** also handle the empty state (DoD 7).
- Errors **MUST** be understandable to the user and, where it makes sense, offer a retry.
  - Permission errors (403) are shown differently from not-found or not-a-member (404), and both
    differ from network or server failures.
  - Validation messages (400) are shown next to the field they relate to.
- A failed change **MUST** leave the screen matching the server's state. If a change is shown
  before the server confirms it, it **MUST** be undone when the request fails.
- An empty list is not an error and **MUST NOT** look like one.
- The same state is shown the same way across all features.

## 7. Feature and Module Responsibility

- Files in `src/app/` are **routes only**, as Expo Router expects. They assemble screens and own
  navigation. They **SHOULD NOT** contain business logic, network calls, or reusable UI.
- Code is grouped by **feature**, for example auth, issues, comments, and board. A feature owns its
  screens, its feature-specific components, and its use of the API layer.
- Shared components belong in `src/components/` only once **two or more** features actually use
  them.
- Each module has one clear responsibility. If describing its purpose needs an "and", split it.
- One feature **MUST NOT** reach into another feature's internals. Anything shared goes through a
  deliberate shared module.

## 8. State

- **Default to local component state.** Lift state only as far as the components that actually
  share it.
- App-wide state is limited to what really is app-wide: the authenticated session and the current
  user's identity. Making anything else app-wide needs a recorded reason.
- Server data is a **copy of the server**, not the source of truth. It **MUST** be refreshable, and
  it **MUST NOT** be copied into several places that can drift apart.
- Role and permission checks in the UI decide what is *offered*. The backend still decides what is
  *allowed*. The app **MUST** handle a refusal even when the UI expected the action to succeed.
- Choosing a state-management library is a recorded decision. It is not the default answer to
  shared state.

## 9. Dependency Discipline

- Add packages **only** with `npx expo install <package>`, never with `npm install` directly. Use
  npm only; `package-lock.json` is committed.
- Before a dependency is added, the pull request **MUST** state:
  - what it is for
  - why the platform or an Expo module cannot do the job
  - whether it contains native code (native code requires a development build instead of Expo Go)
  - its maintenance status and licence
- Prefer official Expo modules and packages already installed. Do not add a dependency for
  something a few lines of code can do.
- **Never** create or edit `ios/` or `android/` by hand. Native configuration goes through
  `app.json` and config plugins.
- After dependency changes, `npx expo install --fix` and `npx expo-doctor` **MUST** come back
  clean.
- Expo changes quickly. Check the documentation for the installed SDK version before using any API
  from memory.

## 10. Reuse Framework Conventions

- Use **Expo Router** for all navigation, with `Link`, `router`, and `useLocalSearchParams` from
  `expo-router`. Do not add a parallel navigation system.
- Follow the repository's existing conventions:
  - kebab-case filenames
  - the `@/` import alias
  - `.web.tsx` and other platform-extension files for platform-specific code
  - `_layout.tsx` files for navigators
- Prefer the platform's built-in iOS behaviour (navigation patterns, gestures, safe areas, system
  controls) over custom versions of the same thing.
- If a convention seems wrong, change it once, deliberately, and record the decision. Do not add a
  competing convention alongside it.

## 11. Avoid Premature Abstraction

- Write the concrete version first. Abstract only when a **third** real use appears, or when
  duplicated code has already caused a bug.
- Do not build:
  - generic frameworks or base classes
  - configuration-driven screens
  - plugin systems or repository layers "for later"
- Some duplication is cheaper than the wrong abstraction. Revisit it when real requirements arrive.
- Do not write extension points for post-V1 features (`MOBILE_SCOPE.md` §E).

## 12. Testability

- Keep logic that has no UI out of components. This includes mapping API data, permission rules,
  grouping, sorting, mention formatting, and input checks. Plain functions are easy to test.
- The API layer **MUST** be replaceable in tests. No hidden global network calls.
- Every bug fix **SHOULD** include a test that would have caught it, once a test setup exists. The
  choice of test tooling is a recorded decision.
- Milestones are accepted by running against the real backend (`ROADMAP.md`). Tests with mocked
  data do not replace that.
- **Before any task is called done:**
  - `npx expo lint` and `npx tsc --noEmit` **MUST** pass
  - the change **MUST** be exercised in the iOS simulator

## 13. Scalability and Performance

- **Lists have no limit**, because the API has no pagination. Any list that can grow **MUST** use
  a virtualized list and **MUST NOT** render everything at once.
- Avoid sending the same request twice at the same time.
- Searches **MUST** wait until the user pauses typing and **MUST** respect the API minimums (user
  search: `q` of at least 2 characters).
- Polling, if it is ever used, **MUST** have a stated interval and **MUST** stop while the app is
  in the background.
- Measure before optimizing. A performance change **SHOULD** come with evidence, such as
  before-and-after numbers or a profile.

## 14. Accessibility and Touch Baseline

- Every interactive element **MUST** have a tap area of at least **44×44 pt**, the Apple Human
  Interface Guidelines minimum.
- Every control **MUST** have an accessible label and role. Icon-only buttons are never
  unlabelled.
- Text **MUST** respect the user's system text-size setting (Dynamic Type) without being cut off
  or overlapping.
- No action may be possible **only** through a gesture. Every drag or swipe has a tap alternative.
- No information may depend on colour alone. Status always has a text label or an icon as well.
- Every V1 journey **MUST** be usable with VoiceOver.
- Respect the system's reduced-motion setting.

## 15. Maintainability and Process

- **Small, focused changes.** One concern per pull request.
- **Comments** explain *why*, not *what*. Any backend behaviour that is not obvious, for example
  "PATCH returns the bare issue", gets a comment where it is handled.
- **No dead code, commented-out code, or untracked TODOs.** Every TODO links to an open question
  or an issue.
- **Decisions** are recorded in a decision log with the date and the reason. This covers the
  storage choice, test tooling, the state approach, and any departure from these standards.
- **Workspace rules still apply.** Commit, push, and branch only when explicitly authorized. No AI
  attribution in code, comments, commits, or documentation.

---

## Open Points for Future Review

These points do not block adoption. The standards above apply as written until a point is
reviewed and any change is recorded.

- Whether the decision log is a section of this document or a separate file.
- Whether the "third use" rule in §11 is too strict.
- Whether 44×44 pt is the right touch baseline, or a stricter one is wanted.
