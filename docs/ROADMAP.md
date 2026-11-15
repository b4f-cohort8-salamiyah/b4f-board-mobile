# B4F Board Mobile — V1 Delivery Roadmap

| Field | Value |
| --- | --- |
| Date | November 15, 2026 |
| Scope | [`MOBILE_SCOPE.md`](./MOBILE_SCOPE.md) |
| Product authority | [`PRODUCT_REQUIREMENTS_V1.md`](./PRODUCT_REQUIREMENTS_V1.md) |
| Backend behaviour | [`CAPABILITY_MATRIX.md`](./CAPABILITY_MATRIX.md) (source inspection complete; runtime verification pending) |
| Capability classification | **Accepted** (`MOBILE_SCOPE.md` §B–§F) |
| Implementation authorization | **Not granted** |

This roadmap turns the V1 scope into incremental milestones. Each milestone delivers a meaningful
increment of the mobile experience.

### Ground rules for every milestone

- **No dates or effort estimates.** The order of milestones is the plan.
- **No architecture or technology decisions.** The roadmap does not choose libraries, navigation,
  or state management.
- **No backend modifications.** Every milestone uses only the existing API.
- **API contracts are verified slice by slice** (`ARCHITECTURE.md` §17).
  - Every endpoint cited here comes from source inspection in `CAPABILITY_MATRIX.md`, which is the
    initial evidence only.
  - Each milestone verifies, against the real backend, the contracts it relies on, before or
    during its delivery and to the level that milestone requires.
  - If runtime behaviour differs from the documented contract, the contract and evidence are
    corrected before implementation continues to rely on it.
  - Mocked tests never replace verification against the real backend.
- **POST-V1 capabilities are not scheduled** (`MOBILE_SCOPE.md` §E). This includes the former V1
  candidates: issue deletion, in-app notifications, and drag-and-drop.
- **"Within permissions"** means the rule in `MOBILE_SCOPE.md` §G. For issue edit and status
  change, that is assignee / reporter / OWNER / ADMIN.

### V1 coverage

| V1 capability (`MOBILE_SCOPE.md` §C) | Classification | Milestone |
| --- | --- | --- |
| Login | CORE | M1 |
| Get current user | CORE | M1 |
| Local logout / session termination | MOBILE-ADAPTED | M1 |
| Token-expiry / interrupted-session handling | MOBILE-ADAPTED | M1 |
| My Issues | MOBILE-ADAPTED | M1 (prioritization rule completed in M5) |
| Issue details | MOBILE-ADAPTED | M1 (read-only) |
| Change issue status | MOBILE-ADAPTED | M2 |
| Create issue | MOBILE-ADAPTED | M3 |
| List accessible workspaces | CORE | M3 (project choice on creation); M4 |
| List projects in an accessible workspace | CORE | M3 (project choice on creation); M4 |
| Read comments | CORE | M3 |
| Add comments | MOBILE-ADAPTED | M3 |
| Mention teammates | MOBILE-ADAPTED | M3 |
| Search eligible users for mentions | MOBILE-ADAPTED | M3 |
| Select / switch accessible project context | MOBILE-ADAPTED | M4 |
| View project information needed for navigation | CORE | M4 |
| List project issues | CORE | M4 |
| View project board | MOBILE-ADAPTED | M4 |
| Group issues by workflow status | MOBILE-ADAPTED | M4 |
| Open issue details from board | MOBILE-ADAPTED | M4 |
| Change issue status from board without dragging | MOBILE-ADAPTED | M4 |
| Per-status issue counts as supporting board information | MOBILE-ADAPTED | M4 |
| Edit issue title | MOBILE-ADAPTED | M5 |
| Edit issue description | MOBILE-ADAPTED | M5 |
| Change priority | MOBILE-ADAPTED | M5 |
| Change assignee | MOBILE-ADAPTED | M5 |
| Edit story points | MOBILE-ADAPTED | M5 |

Cross-cutting definition-of-done items (states, permissions, polish, device validation, unchanged
backend) are completed in M5.

---

## Milestone 0 — Readiness and Verification

**1. Goal.**

- Establish the runtime-verification process used by every slice.
- Verify against the real backend the API contracts that Milestone 1 relies on, so the first
  slice can start safely.
- Contracts needed only by later milestones are verified before or during the milestone that
  relies on them, not here.

**2. User value.** Indirect. It removes the highest-risk unknown for the first slice (API
compatibility of authentication and My Issues) before users depend on that journey. It also sets
up the process that later slices reuse.

**3. Included capabilities.**

- None are delivered.
- This milestone verifies the contracts behind the M1 capabilities: login, get current user,
  local logout and session termination, token-expiry handling, My Issues, and read-only issue
  details.

**4. Relevant API contracts to verify.**

**Required for M1:**

- `POST /auth/login`, including the 401 for invalid credentials.
- `GET /auth/me`.
- `GET /users/me/issues`.
- `GET /issues/:id`, including 404 "Workspace not found" for an inaccessible issue and 400 for a
  non-UUID id.
- Token expiry behaviour and the resulting 401 on an authenticated request.

**Verified later, in the slice that relies on them:**

| Contracts | Verified in |
| --- | --- |
| `PATCH /issues/:id` `{status}` (including the bare response shape); `GET /workspaces` (including `myRole`, used by the permission rule); 403 for a non-permitted change | M2 |
| `POST /projects/:projectId/issues`; `GET /workspaces/:workspaceId/projects`; `GET /issues/:issueId/comments`; `POST /issues/:issueId/comments`; the mention format and non-member rejection; `GET /users/search` with `membersOnly=true` and the 2-character minimum; the comment-reply question (`MOBILE_SCOPE.md` §H, open question 4); the assignee-option contracts (§H, open question 6) | M3 |
| `GET /projects/:id`; `GET /projects/:projectId/issues` | M4 |
| `PATCH /issues/:id` for the remaining editable fields, including `null` handling | M5 |

Earlier verification of any of these is allowed but not required for M0.

**5. Expected deliverables.**

- **The runtime-verification process:**
  - a verification record format giving one outcome per contract: verified, differs from the
    documentation (with details), or unable to verify
  - the rule that differences are corrected in the contract and evidence before implementation
    relies on them
- **Verification records** for the M1 contracts listed in item 4.
- **Test accounts** covering OWNER, ADMIN, and MEMBER, plus an assignee, a reporter, and an
  unrelated member, for use by every later slice.
- **Open items mapped to milestones:**
  - each `CAPABILITY_MATRIX.md` §6 open item is assigned to the milestone that relies on it
  - each `MOBILE_SCOPE.md` §H open question is assigned to the milestone it blocks

**6. Dependencies.**

- A running instance of the existing backend with seeded data.
- Authorization to run it locally. Running it does not modify it.

**7. Risks and constraints.**

- Runtime behaviour may differ from the code inspection.
- No backend change is allowed as a remedy. Differences are documented as limitations (DoD 11).

**8. Acceptance criteria.**

- Every M1 contract in item 4 has a recorded outcome.
- The 8-hour expiry and the resulting 401 are confirmed, or recorded as unconfirmed with the
  agreed interim handling for M1.
- The verification record format and process are documented, so later slices reuse them.
- The role and relationship test accounts exist and can sign in.
- Every `CAPABILITY_MATRIX.md` §6 open item and `MOBILE_SCOPE.md` §H open question is assigned to
  the milestone that relies on or is blocked by it.
- No file in the backend repository has changed.

**9. Completion gate.**

- The M1 verification records have been reviewed and accepted.
- Every M1 blocker is resolved or explicitly accepted as a limitation.
- Verification of later-milestone contracts is **not** part of this gate.

**10. Exclusions.**

- Backend modifications.
- Application code.
- Architecture or technology selection.
- Resolving product decisions; they are recorded, not decided.
- Exhaustive runtime verification of contracts needed only by M2–M5.

---

## Milestone 1 — Authentication, My Issues, and Issue Detail

**Minimum vertical slice:** Login → authenticated session (persisted and restored on relaunch) →
My Issues → read-only issue detail.

**1. Goal.** Prove that a real user can sign in, stay signed in across relaunch, retrieve their
assigned issues, open an issue's details, and use a genuinely useful mobile home screen.

**2. User value.** The primary journey "Review assigned work" (requirements §3.1) becomes possible
from a phone.

**3. Included capabilities.**

- Login and get current user (CORE).
- Local logout / session termination (MOBILE-ADAPTED).
- Token-expiry / interrupted-session handling (MOBILE-ADAPTED).
- My Issues (MOBILE-ADAPTED).
- Issue details, read-only (MOBILE-ADAPTED). Status changes stay in M2.

**4. Relevant API contracts.**

- `POST /auth/login` returns `{accessToken, user:{id,name,email}}`. Invalid credentials return
  401.
- `GET /auth/me` returns `{id,email,name}`.
- `GET /users/me/issues` returns assigned issues in workspaces I belong to:
  - ordered by `updatedAt` desc
  - no filters and no limit
  - each issue includes `project:{id,key,name,workspaceId}`
- `GET /issues/:id` returns the issue with assignee and reporter (either may be null),
  `project{id,key,name,workspaceId}`, and `_count.comments`. An inaccessible issue returns 404
  "Workspace not found".

**5. Expected deliverables.**

- A login screen.
- An authenticated session.
- Session restoration on relaunch, following `ARCHITECTURE.md` §8.
- A My Issues home screen as the default landing view, with loading, empty, and error states.
- A read-only issue detail view reachable from My Issues.
- Local logout.

**6. Dependencies.**

- M0 complete.
- The accepted session-continuity decision (`ARCHITECTURE.md` §8): the credential persists across
  normal relaunch, startup validates it with `GET /auth/me`, and an invalid or expired credential is
  deleted and the user signed out. The concrete secure-storage mechanism remains deferred.

**7. Risks and constraints.**

- 8-hour expiry, with no refresh and no server-side logout. Local logout does not invalidate the
  token on the server.
- The My Issues list has no limit and no pagination.
- The prioritization rule is undefined (§H open question 2). The backend's `updatedAt` desc order
  is used only as the interim server order; no product prioritization rule is defined here.

**8. Acceptance criteria.**

- **Successful login.** Valid credentials sign the user in and land on My Issues.
- **Failed login.** Invalid credentials show a clear error and do not sign in.
- **Authenticated requests.** Every request after login carries the user's token, and
  `GET /auth/me` identifies the signed-in user.
- **Assigned issues.**
  - Every issue that `GET /users/me/issues` returns for a test user is displayed.
  - Each item shows at least its key, title, status, priority, and project.
  - Tapping an item opens its read-only detail view.
- **Issue details.** The detail view shows the issue's key, title, description, status, priority,
  assignee, reporter, story points, project, and comment count, with null assignee or reporter
  shown clearly.
- **Inaccessible issue.** An issue the user cannot access (404) shows a not-found state, not a
  crash.
- **Loading state.** A loading state is visible while My Issues or an issue's details are being
  fetched.
- **Empty state.** A user with no assigned issues sees a clear empty state, not an error.
- **Request errors.** A network failure or a 5xx response shows an error state with a way to
  retry. The app does not crash.
- **Expired session.**
  - A 401 on any authenticated request returns the user to login with an explanation.
  - After logging in again, the user lands on My Issues.
  - No stale protected content stays visible.
- **Session restoration.**
  - Relaunching with a valid stored credential lands on My Issues without logging in again, after
    `GET /auth/me` succeeds.
  - If startup validation returns 401, the stored credential is deleted and the user is signed
    out.
  - If startup validation fails for a network or server reason, the stored credential is kept,
    no protected content is shown, and a recoverable error state with retry appears until
    validation succeeds or returns 401.
- **Local logout.** After logging out, protected screens cannot be reached without logging in
  again.
- **Platform.** Verified in the iOS simulator.

**9. Completion gate.**

- All acceptance criteria are demonstrated against the real backend with the M0 test accounts.
- My Issues uses the backend's `updatedAt` desc order as the interim order, pending §H open
  question 2.

**10. Exclusions.**

- Status changes and issue creation. Issue details are read-only in M1.
- Comments and the board.
- Registration (POST-V1).
- Notifications (POST-V1).
- Any final My Issues prioritization rule.

---

## Milestone 2 — Issue Status Updates

**1. Goal.** Prove the first write path, completing the read-and-write issue journey on the issue
detail delivered in M1.

**2. User value.** A user can move an assigned issue forward from its details. This
covers "Manage issues" and "Respond to urgent updates" (requirements §3.2 and §3.5).

**3. Included capabilities.**

- Change issue status (MOBILE-ADAPTED), on the read-only issue detail delivered in M1.

**4. Relevant API contracts.**

- `GET /issues/:id` (verified in M1), read again after a successful status change.
- `PATCH /issues/:id` with `{status}` (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`) returns the bare
  issue.
- `GET /workspaces` provides `myRole`, which is needed to apply the permission rule.

**5. Expected deliverables.**

- A touch-friendly status change for permitted users, on the M1 issue detail view.
- Handling of permission and failure outcomes.

**6. Dependencies.**

- M1 complete.
- Runtime verification of the M2 contracts (`GET /workspaces` for `myRole`, the `PATCH` response
  shape, the 403 behaviour), before or during M2.

**7. Risks and constraints.**

- `POST` and `PATCH` responses have a different shape from `GET`.
- Status changes create no notification.
- A non-member gets 404 "Workspace not found".
- The assignee or reporter can be null.

**8. Acceptance criteria.**

- **Permitted status change.**
  - An assignee, reporter, OWNER, or ADMIN can change the status to any of the four values.
  - The new status shows on the issue and in My Issues without restarting the app.
- **Non-permitted users.**
  - A user outside the rule is not offered the status change.
  - If a 403 still occurs, a clear permission message is shown and the displayed status stays
    unchanged.
- **Failed change.** After a network or server failure, the displayed status still matches the
  server, and an error message is shown.
- **States.** Loading, error, and success states exist for the status change.
- **Platform.** Verified in the iOS simulator.

**9. Completion gate.**

- The status-change role and relationship cases (OWNER, ADMIN, and MEMBER as assignee, as
  reporter, and as an unrelated member) have been demonstrated using the test accounts created in
  M0.
- The full journey (My Issues → detail → status change → back) works against the real backend.

**10. Exclusions.**

- Editing other fields (M5).
- Comments (M3).
- Issue deletion (POST-V1).
- The board (M4).
- Issue activity inside details (POST-V1).

---

## Milestone 3 — Issue Creation and Collaboration

**1. Goal.** Complete the essential issue-creation and collaboration journeys.

**2. User value.** A user can capture new work quickly and discuss issues with teammates. This
covers "Manage issues" (create) and "Collaborate" (requirements §3.2 and §3.3).

**3. Included capabilities.**

- Create issue (MOBILE-ADAPTED).
- List accessible workspaces and list projects (CORE), used to choose the project for a new issue.
- Read comments (CORE).
- Add comments, mention teammates, and search eligible users for mentions (MOBILE-ADAPTED).

**4. Relevant API contracts.**

- `POST /projects/:projectId/issues`:
  - required: `title` 1–200
  - optional: `description` ≤5000, `priority`, `assigneeId`, `storyPoints` 0–999
  - status cannot be set
  - any member may create
  - `sprintId` is accepted but not used, because sprint selection is POST-V1
- Choosing a project: `GET /workspaces` and `GET /workspaces/:workspaceId/projects`.
- Choosing an assignee: unresolved (§H open question 6).
- Comments:
  - `GET /issues/:issueId/comments`: oldest first, no limit
  - `POST /issues/:issueId/comments`: `body` 1–3000, any member
- Mentions:
  - `GET /users/search?q&workspaceId&membersOnly=true`: `q` must be at least 2 characters, at
    most 10 results
  - mentions are written `@[Display Name](<uuid>)`

**5. Expected deliverables.**

- Quick creation from minimal required input, plus expandable optional details.
- A comment list on issue detail, with the ability to add comments.
- Mention search and insertion.

**6. Dependencies.**

- M2 complete.
- An answer to §H open question 4 (replies), or an explicit deferral.
- An answer to §H open question 6 (assignee options), or an explicit deferral of assignee choice
  at creation to M5.

**7. Risks and constraints.**

- Threaded replies were not found in the API.
- Mentioning a non-member returns 400.
- An assignee who is not a member returns 404 "Workspace not found".
- The create response is the bare issue.
- Comment lists have no limit.
- The comment author can be null.

**8. Acceptance criteria.**

- **Quick creation.** A user can create an issue by entering only a title and choosing a project.
  The new issue appears with status `TODO` and its generated key.
- **Optional details.** The optional fields respect the API limits, and validation errors (400)
  show their messages next to the relevant field.
- **Reading comments.** The comments on an issue are shown oldest first.
- **Adding comments.** A comment the user adds appears without restarting the app.
- **Mentions.**
  - Search starts only after 2 or more characters.
  - Results are limited to workspace members.
  - The selected mention is submitted in the required format.
  - The mentioned user receives a notification; this is confirmed with a second test account.
- **Rejected mentions.** A rejected mention (400) shows a clear message, and the comment text is
  not lost.
- **Replies.** Behaviour follows the answer to §H open question 4. Threaded replies are not
  presented unless the API is confirmed to support them.
- **States.** Creation and comments each have loading, empty ("no comments yet"), error, and
  success states.
- **Platform.** Verified in the iOS simulator.

**9. Completion gate.** The creation and comment journeys work end to end against the real
backend, including the mention-notification check and the validation error cases.

**10. Exclusions.**

- Comment editing and deletion (POST-V1).
- Sprint selection on creation (POST-V1).
- Issue deletion (POST-V1).
- In-app notifications (POST-V1).

---

## Milestone 4 — Mobile Project Board

**1. Goal.** Deliver a useful mobile project board without reproducing the desktop UI.

**2. User value.** A user can see a project's work by status and act on it by touch. This covers
"Interact with project boards" (requirements §3.4).

**3. Included capabilities.**

- **Navigation context (CORE):**
  - list accessible workspaces
  - list projects
  - view project information needed for navigation
- **Board data (CORE):** list project issues.
- **Board experience (MOBILE-ADAPTED):**
  - select or switch the accessible project context, including locally remembering the last-used
    accessible workspace and project
  - view the project board
  - group issues by workflow status
  - open issue details from the board
  - change issue status from the board without dragging
  - per-status issue counts

**4. Relevant API contracts.**

- `GET /workspaces`, `GET /workspaces/:workspaceId/projects`, and `GET /projects/:id`
  (navigation, read-only).
- `GET /projects/:projectId/issues`:
  - ordered by `createdAt` desc
  - no pagination
  - filter parameters are not used, because filtering and search are POST-V1
- `GET /issues/:id` to open details.
- `PATCH /issues/:id` with `{status}` (assignee / reporter / OWNER / ADMIN).

**5. Expected deliverables.**

- Project selection and switching, with the last-used context remembered.
- A board view that groups the project's issues by workflow status and shows a count per status.
- Navigation between the board and issue detail.
- Tap-based status actions.

**6. Dependencies.**

- M2 complete (status change; issue detail from M1).
- An answer to §H open question 7 (failed revalidation of the remembered context), or a documented
  interim behaviour.

**7. Risks and constraints.**

- Board lists have no limit (§H open question 8).
- Per-status counts are derived on the device and must not be presented as data the server
  provided.
- The status permission rule applies to board actions.

**8. Acceptance criteria.**

- **Project context.**
  - A user can choose any project in their accessible workspaces.
  - A remembered last-used context is revalidated against the API before it is used.
  - A context that is no longer accessible is not shown as if it still were.
- **Board content.**
  - The board shows the selected project's issues in four groups: `TODO`, `IN_PROGRESS`, `REVIEW`,
    `DONE`.
  - The board is not limited to an active sprint.
- **Counts.** Each group shows a count that matches the number of issues in it.
- **Navigation.** Tapping an issue opens its detail. Returning to the board shows any change
  applied.
- **Status changes.**
  - A permitted user can change an issue's status from the board without dragging, and the issue
    moves to its new group.
  - Non-permitted users are not offered the action.
  - A 403 is handled as in M2.
- **States.** The board has loading, empty (no issues), error, and success states.
- **Platform.** Verified in the iOS simulator.

**9. Completion gate.** The board journeys work end to end against the real backend, with the
board status-change permission cases demonstrated using the test accounts created in M0.

**10. Exclusions.**

- Drag-and-drop board interaction (POST-V1).
- Issue search and filtering (POST-V1).
- Sprint summaries and point totals (POST-V1).
- Sprint and backlog management (POST-V1).
- A dedicated workspace-detail experience (POST-V1).
- Recently viewed, pinned, or history features (not introduced).

---

## Milestone 5 — V1 Completion and Polish

**1. Goal.** Meet the approved V1 definition of done (requirements §8).

**2. User value.** Every approved journey is complete, reliable, and polished, which is the
approved success criterion.

**3. Included capabilities.**

- Edit issue title, edit issue description, change priority, change assignee, and edit story
  points (all MOBILE-ADAPTED).
- Completion of My Issues with the agreed prioritization rule.
- Cross-cutting completion of every V1 capability.

**4. Relevant API contracts.**

- `PATCH /issues/:id`:
  - fields: `title`, `description`, `priority`, `assigneeId` (or null), `storyPoints` (or null)
  - permission: assignee / reporter / OWNER / ADMIN
  - returns the bare issue
- All contracts from M1–M4.

**5. Expected deliverables.**

- Editing of permitted fields.
- Consistent loading, empty, error, and success states across all journeys.
- Role and permission validation.
- Interaction and responsiveness refinements.
- Device validation.
- A final API-limitations record.

**6. Dependencies.**

- M1–M4 complete.
- An answer to §H open question 2 (My Issues prioritization).
- An answer to §H open question 6 (assignee options).

**7. Risks and constraints.**

- Editing a description notifies every mention in it again.
- Sending `null` for required fields is unverified.
- No backend change may be used to resolve any issue.

**8. Acceptance criteria.**

- **Editing.**
  - A permitted user can edit the title, description, priority, assignee (including unassigning),
    and story points (including clearing them).
  - Changes show immediately and still match the server after a refresh.
- **Validation.**
  - API limits are respected: title 1–200 characters, description up to 5000, story points 0–999.
  - A rejected edit leaves the displayed values unchanged and shows a message.
- **My Issues.** My Issues follows the agreed prioritization rule.
- **States.** Every screen in every journey has consistent loading, empty, error, and success
  states (DoD 7).
- **Permissions.** Using the test accounts created in M0, every approved V1 action is offered only
  where the role or relationship permits it, and backend refusals are handled gracefully.
- **Devices.** Every approved journey passes in the iOS simulator **and** on a physical iPhone
  (DoD 9).
- **Backend.** The backend repository shows no modifications (DoD 10).
- **Limitations.** Every API limitation or blocked requirement found during delivery is
  documented and reviewed (DoD 11).

**9. Completion gate.** All 11 definition-of-done items in `PRODUCT_REQUIREMENTS_V1.md` §8 are met
and reviewed.

**10. Exclusions.**

- Every POST-V1 capability.
- V1 non-goals.
- Undecided items: offline, tablet, and advanced reporting.

---

## Former V1 Candidates

The accepted classification resolves the three V1 candidates from the requirements. They are
**not scheduled** in V1.

| Former candidate | Classification | Relevant contract |
| --- | --- | --- |
| Issue deletion | POST-V1 | `DELETE /issues/:id` (assignee / reporter / OWNER / ADMIN) |
| In-app visibility of issue updates | POST-V1 (in-app notifications and notification management) | Notification endpoints (polling only, 50 most recent) |
| Specific board drag-and-drop interactions | POST-V1 (drag-and-drop board interaction) | `PATCH /issues/:id` `{status}` |

---

## Post-V1 Roadmap

These are future product areas, grouped for orientation only. **They have no release dates, and
none is an approved V2 commitment.** Details are in `MOBILE_SCOPE.md` §E.

| Area | Deferred capabilities | Backend note |
| --- | --- | --- |
| Account | Registration; profile management | Register returns no token. Profile covers name and password only; email cannot be changed. |
| Issue management | Issue deletion; project issue search and filtering; issue activity inside issue details | Routes and query parameters exist. |
| Collaboration | Comment editing; comment deletion | Mentions are notified again on every edit. There is no edited marker. |
| Board interaction | Drag-and-drop board interaction | Client-side only. The backend receives only the status update. |
| Notifications | In-app notifications and notification management; push notifications and preferences | In-app notification endpoints exist (polling only). There is no push, device-token, or real-time support. |
| Planning | Sprint summaries and point totals; sprint selection during issue creation; sprint and backlog management | Sprint routes exist (management is OWNER / ADMIN). There is no sprint delete. |
| Activity | Dedicated activity experience | Read-only routes exist. Some are capped at 50. |
| Administration | Dedicated workspace-detail experience; workspace administration; project administration; member administration | Routes exist. Slugs and keys cannot be changed. There is no leave-workspace route. |
