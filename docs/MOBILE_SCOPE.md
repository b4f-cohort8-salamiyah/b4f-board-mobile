# B4F Board Mobile — Mobile Scope

| Field | Value |
| --- | --- |
| Date | November 15, 2026 |
| Product authority | [`PRODUCT_REQUIREMENTS_V1.md`](./PRODUCT_REQUIREMENTS_V1.md) (approved) |
| Backend behaviour reference | [`CAPABILITY_MATRIX.md`](./CAPABILITY_MATRIX.md) (source inspection complete; runtime verification pending) |
| Delivery sequence | [`ROADMAP.md`](./ROADMAP.md) |
| Capability classification | **Accepted.** See §B–§F |
| Implementation authorization | **Not granted** |

This document defines what belongs in B4F Board Mobile V1 and what does not. It records accepted
decisions only. Where a point is still undecided, it stays undecided here (§H).

> **Evidence level.** Every backend statement comes from the source-code inspection recorded in
> `CAPABILITY_MATRIX.md`. None of it is verified at runtime yet. Runtime verification is
> Milestone 0 of the roadmap.

---

## A. Overview

**Purpose.** B4F Board Mobile is an issue-centric, action-first mobile companion to B4F Board. It
helps team members check their assigned work quickly, respond to updates, and carry out everyday
issue management from their phones. Its core value: *understand what needs attention, access
relevant context, and act quickly.*

**Target users.**

- Primary: team members who manage assigned issues, update progress, and collaborate through
  comments and mentions.
- Secondary: project managers and workspace administrators who occasionally need project
  information and issue-management workflows.

All functionality must respect existing roles and permissions.

**Relationship to the web application.**

- The mobile app is a faster, simpler, touch-friendly alternative, not a reproduction of the
  Next.js web app.
- Mobile workflows and navigation may intentionally differ from the web.
- Existing web functionality does not automatically qualify for mobile.

**Platform.**

- React Native / Expo, iOS first.
- V1 distribution is limited to local development, the simulator, and physical-device testing.

**Fixed backend.**

- The existing NestJS API must not be modified.
- No new endpoints may be added, and existing API behaviour may not change.

---

## B. Classification Definitions

| Label | Meaning |
| --- | --- |
| **CORE** | A V1 capability delivered with essentially the same behaviour as the existing product, within existing API contracts. |
| **MOBILE-ADAPTED** | A V1 capability that is in scope, but whose interaction or presentation deliberately differs from the web for mobile use. |
| **PRODUCT-LEVEL EXCLUDED** | A capability that does not belong in the intended mobile product and is not planned for any release. |
| **POST-V1** | A capability that belongs in the mobile product but is deferred beyond V1. Deferred, not excluded. |

**CORE and MOBILE-ADAPTED are both part of V1.** The difference is how a capability is treated,
not whether it ships.

**Former V1 candidates.** The requirements (§7.1) listed three V1 candidates: issue deletion,
in-app visibility of issue updates, and specific drag-and-drop board interactions. The accepted
classification resolves all three as **POST-V1** (§E). No V1 candidates remain open.

**Backend limitations are not exclusions.** Capabilities the fixed backend cannot support are
recorded as technical constraints (§G), not as product-level exclusions.

---

## C. V1 Mobile Scope

### Permission shorthand

- **Assignee / reporter / OWNER / ADMIN:** the issue's assignee, the issue's reporter, or a
  workspace OWNER or ADMIN.
- **Member:** any member of the issue's workspace.

### C.1 CORE

| Capability | Mobile behaviour / expectations | Existing API support | Notes / constraints |
| --- | --- | --- | --- |
| Login | Sign in with email and password. | `POST /auth/login` returns `{accessToken, user:{id,name,email}}`. | Invalid credentials return 401. Bearer JWT, 8-hour default expiry. |
| Get current user | Identify the signed-in user. | `GET /auth/me` returns `{id,email,name}`. | |
| List accessible workspaces | See the workspaces the user belongs to. | `GET /workspaces` returns workspaces with `myRole` and counts. | Only the user's memberships. No limit. |
| List projects in an accessible workspace | See a workspace's projects. | `GET /workspaces/:workspaceId/projects` returns projects with `_count.issues`. | Member only. No limit. |
| View project information needed for navigation | Show the project being worked in. | `GET /projects/:id` | Member only; a non-member gets 404 "Workspace not found". |
| List project issues | Retrieve a project's issues. | `GET /projects/:projectId/issues` | Order fixed at `createdAt` desc. No pagination, no limit. V1 does not use the filter and search parameters (they are POST-V1, §E). |
| Read comments | Read an issue's comments. | `GET /issues/:issueId/comments` | Oldest first. No limit. The author can be null. |

### C.2 MOBILE-ADAPTED

| Capability | Mobile behaviour / expectations | Existing API support | Notes / constraints |
| --- | --- | --- | --- |
| Local logout / session termination | Signing out ends the session on the device. | None. The API has no logout route. | The token cannot be revoked on the server and stays valid until it expires. |
| Token-expiry / interrupted-session handling | When the session ends, the user is returned to login with an explanation. | Any authenticated request returns 401 once the session has ended. | 8-hour default expiry. No refresh token. |
| Select / switch accessible project context | Move between the user's accessible workspaces and projects by touch. Remember the last-used accessible workspace/project context locally. | `GET /workspaces`, `GET /workspaces/:workspaceId/projects`, `GET /projects/:id` | The remembered context is device-only and must be revalidated against the API before use. No recently viewed, pinned, or history features (§I). |
| My Issues | The app opens to My Issues: assigned work shown in a prioritized order, leading directly to issue details. | `GET /users/me/issues` returns issues assigned to me in workspaces I still belong to, with `project:{id,key,name,workspaceId}`. | Order fixed at `updatedAt` desc. No filters, no limit. No assignee, reporter, or sprint objects. The prioritization rule is unresolved (§H). |
| Issue details | View the issue and enough context to decide what to do. | `GET /issues/:id` includes assignee, reporter, project, and `_count.comments`. | No sprint object. UUID only. Issue activity is POST-V1 (§E). |
| Create issue | Create quickly from minimal input, with optional details available when needed. | `POST /projects/:projectId/issues`: `title` 1–200 required; optional `description` ≤5000, `priority`, `assigneeId`, `storyPoints` 0–999. | Any member. Status cannot be set and starts as `TODO`. The response is the bare issue. An assignee who is not a member returns 404. Sprint selection is POST-V1 (§E). |
| Change issue status | Change status quickly. | `PATCH /issues/:id` with `{status}` (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`) | Assignee / reporter / OWNER / ADMIN, otherwise 403. Returns the bare issue. Any status can move to any other. No notification is created. |
| Edit issue title | Edit the title. | `PATCH /issues/:id` with `{title}` (1–200) | Same permission rule. The web app does not offer this; the API supports it. |
| Edit issue description | Edit the description, including mentions. | `PATCH /issues/:id` with `{description}` (≤5000) | Same permission rule. Every mention in the new text is notified again on each edit. |
| Change priority | Change priority. | `PATCH /issues/:id` with `{priority}` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) | Same permission rule. |
| Change assignee | Assign, reassign, or unassign. | `PATCH /issues/:id` with `{assigneeId}` (UUID or null) | Same permission rule. An assignee who is not a member returns 404. The source of assignee options is unresolved (§H). |
| Edit story points | Set or clear story points. | `PATCH /issues/:id` with `{storyPoints}` (0–999 or null) | Same permission rule. |
| View project board | See a project's work on a touch-friendly board. | `GET /projects/:projectId/issues` | **The V1 board shows the accessible project's issues.** It is not limited to the active sprint. No pagination. |
| Group issues by workflow status | The board groups issues into `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`. | Derived on the device from `GET /projects/:projectId/issues`. | |
| Open issue details from board | Tap an issue on the board to open it. | `GET /issues/:id` | |
| Change issue status from board without dragging | Change status from the board with a tap-based action. | `PATCH /issues/:id` with `{status}` | Assignee / reporter / OWNER / ADMIN. **No drag-and-drop in V1** (§E). |
| Per-status issue counts as supporting board information | Show how many issues are in each status. | No count endpoint. Derived on the device from `GET /projects/:projectId/issues`. | Must not be presented as data the server provided. |
| Add comments | Add a comment to an issue. | `POST /issues/:issueId/comments` with `body` 1–3000 | Any member. Threaded replies are unresolved (§H). |
| Mention teammates | Mention workspace members in comments and descriptions. | Mentions are written `@[Display Name](<uuid>)` in the text. | Only the UUID matters. Mentioning a non-member returns 400. Mentioned users are notified. |
| Search eligible users for mentions | Find members to mention. | `GET /users/search?q&workspaceId&membersOnly=true` | `q` must be at least 2 characters. At most 10 results. |

### Constraints that apply to all V1 capabilities

- Every journey must handle loading, empty, error, and success states consistently (DoD 7).
- Every journey must be validated in the iOS simulator and on a physical device (DoD 9).
- Hiding actions a role cannot perform is a mobile-side concern. The backend enforces the rules
  regardless.

### Coverage of the approved V1 essential capabilities

| `PRODUCT_REQUIREMENTS_V1.md` §6.2 | Covered by |
| --- | --- |
| 1. Authentication and session management | Login; get current user; local logout; token-expiry handling |
| 2. My Issues as the default opening screen | My Issues |
| 3. Issue details | Issue details |
| 4. Issue status updates | Change issue status; change status from board without dragging |
| 5. Quick issue creation with expandable details | Create issue |
| 6. Issue editing | Edit title; edit description; change priority; change assignee; edit story points |
| 7. Comments and mentions | Read comments; add comments; mention teammates; search eligible users for mentions |
| 8. Touch-friendly project board with hybrid interaction | Select / switch project context; list workspaces; list projects; view project information; list project issues; view board; group by status; open details from board; change status without dragging; per-status counts |

---

## D. V1 Candidates

**None remain.** All three former candidates are classified POST-V1:

| Former candidate | Classification | Recorded in |
| --- | --- | --- |
| Issue deletion | POST-V1 | §E |
| In-app visibility of issue updates | POST-V1, as in-app notifications and notification management | §E |
| Specific board drag-and-drop interactions | POST-V1, as drag-and-drop board interaction | §E |

---

## E. Post-V1 Capabilities (deferred, not excluded)

These belong in the mobile product but are deferred beyond V1. The rationale is the approved V1
focus: issue-centric, action-first, with limited development time.

| Capability | Related existing API support | Notes |
| --- | --- | --- |
| Registration | `POST /auth/register` (returns no token) | |
| Dedicated workspace-detail experience | `GET /workspaces/:id` | V1 uses workspaces only to select a project context. |
| Project issue search / filtering | `GET /projects/:projectId/issues` query: `status`, `priority`, `assignee`, `sprintId`, `backlog=true`, `q` | |
| Sprint summaries / point totals | `GET /projects/:projectId/sprints`, `GET /sprints/:id` | |
| Sprint selection during issue creation | `sprintId` on `POST /projects/:projectId/issues` | |
| Issue deletion | `DELETE /issues/:id` (assignee / reporter / OWNER / ADMIN) | Former V1 candidate. |
| Comment editing | `PATCH /comments/:id` (author / OWNER / ADMIN) | Mentions are notified again on every edit. No edited marker. |
| Comment deletion | `DELETE /comments/:id` (author / OWNER / ADMIN) | |
| Issue activity inside issue details | `GET /issues/:id/activity` (no limit) | |
| In-app notifications and notification management | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `POST /notifications/read-all`, `DELETE /notifications/:id` | Former V1 candidate. Polling only. 50 most recent. |
| Drag-and-drop board interaction | Client-side only; the backend receives `PATCH /issues/:id` `{status}` | Former V1 candidate. |
| Dedicated activity experience | `GET /users/me/activity` (50), `GET /workspaces/:id/activity` (50) | |
| Sprint / backlog management | Create, edit, start, and complete sprints (OWNER / ADMIN). Move an issue via `PATCH /issues/:id` `{sprintId}`. | |
| Workspace administration | `POST /workspaces`, `PATCH /workspaces/:id` (OWNER / ADMIN), `DELETE /workspaces/:id` (OWNER) | Slugs cannot be changed. |
| Project administration | `POST /workspaces/:workspaceId/projects`, `PATCH /projects/:id`, `DELETE /projects/:id` (OWNER / ADMIN) | Keys cannot be changed. |
| Member administration | `GET`/`POST /workspaces/:id/members`, `PATCH`/`DELETE /workspaces/:id/members/:userId` | Add is OWNER / ADMIN; role change is OWNER only. |
| Profile management | `PATCH /users/me` (name; password with `currentPassword`) | |
| Push notifications / preferences | **None** | The fixed backend has no push, device-token, or real-time support. |

---

## F. Product-Level Exclusions

**None currently.** No capability is classified PRODUCT-LEVEL EXCLUDED.

This is separate from three other categories:

- **V1 non-goals** (`PRODUCT_REQUIREMENTS_V1.md` §6.4). These are stated for V1, not as permanent
  exclusions.
- **POST-V1 capabilities** (§E). These are deferred, not excluded.
- **Backend limitations** (§G). Things the fixed backend cannot support are technical
  constraints, not product decisions.

The only **absolute** constraint is the backend. Modifying or extending the NestJS backend is
ruled out, not merely deferred.

---

## G. Backend and Product Constraints

All of the following come from `CAPABILITY_MATRIX.md` (source inspection). None is verified at
runtime.

| Area | Constraint |
| --- | --- |
| Backend | Immutable NestJS API. No new endpoints, no behaviour changes. No global path prefix or versioning. |
| Authentication | Bearer JWT in `Authorization`. 8-hour default expiry (`JWT_EXPIRES_IN`). |
| Session lifecycle | No refresh token, no logout endpoint, no revocation. Local logout cannot invalidate the token on the server. |
| Authorization | Enforced in services. Non-member: 404 "Workspace not found" (also on project, issue, and comment URLs). Wrong role: 403. Non-UUID id: 400. Issue edit and status change: assignee / reporter / OWNER / ADMIN. Issue creation and commenting: any member. |
| Pagination | None. Lists with no limit: workspaces, members, projects, sprints, project issues, my issues, comments, issue activity. Fixed caps: user search 10; notifications 50; my activity 50; workspace activity 50. |
| Sorting | The client cannot choose a sort order. Project issues: `createdAt` desc. My issues: `updatedAt` desc. Comments: `createdAt` asc. |
| Change detection | `updatedAt` only on issues and sprints. No "changes since" requests, no ETag support. |
| Real-time and push | None. No WebSockets, server-sent events, device tokens, or push. |
| Notifications | 50 most recent, no pagination, no mark-unread. Status changes create no notification. |
| Mentions | Written `@[Display Name](<uuid>)`; only the UUID matters. A non-member mention returns 400. Search needs `q` of at least 2 characters, returns at most 10 results, with `membersOnly=true`. Editing a description notifies every mention again. |
| Response shapes | `GET /issues/:id` includes related objects. `POST` and `PATCH` on issues return the bare issue. |
| Comments | No threaded-reply support found. Inferred from a response shape with no parent field; not confirmed. The author can be null. |
| Errors | `{ statusCode, message (string \| string[]), error, path, timestamp }`. Unhandled database errors return a generic 500. |
| Not supported by the backend | Server-side logout or refresh; push or real-time; pagination; issue lookup by key; "issues reported by me"; leaving a workspace; deleting a sprint; marking a notification unread; changing email; attachments. |
| Distribution | Local development, simulator, and physical device only. |

---

## H. Open Questions

This section tracks remaining open questions and preserves questions that were later resolved by
accepted product or architecture decisions.

### Product

1. **Existing API compatibility (highest risk).** The endpoints, authorization, and response
   contracts must be verified at runtime (`ROADMAP.md` Milestone 0).
2. **My Issues prioritization.** The ordering and filtering rules are undefined. The backend
   provides only `updatedAt` desc and no filters.
3. **Scope and timeline.** There is no formal deadline or effort budget.

### Technical

4. **Comment replies.** V1 includes adding comments and continuing issue discussions. Source
   inspection found no threaded-reply support in the API (inferred, unconfirmed), so whether any
   reply or parent concept exists remains a runtime-verification question.
5. *Resolved: session persistence.* See "Resolved by accepted architecture decisions" below. The
   number is kept so existing references to the remaining questions stay valid.
6. **Assignee options.** Which existing contract supplies assignable members:
   `GET /workspaces/:id/members`, or `GET /users/search` with `membersOnly=true`.
7. **Remembered project context.** What happens when the remembered workspace or project fails
   revalidation, for example after membership is removed.
8. **Unpaginated lists.** The behaviour of large My Issues and board lists, given that the API has
   no pagination.
9. **Unverified backend behaviour:**
   - sending `null` for required issue fields
   - framework defaults (JWT algorithm, body-size limit, ETag behaviour, Swagger JSON path)

### Resolved by the accepted classification

| Earlier question | Resolution |
| --- | --- |
| Board interaction / drag-and-drop | No drag-and-drop requirement in V1 (POST-V1). Tap-based status changes. |
| Board content | The V1 board shows accessible project issues grouped by workflow status. No active-sprint-only semantics. |
| Board filtering and search | POST-V1. |
| Update awareness / in-app visibility | In-app notifications and notification management are POST-V1. |
| Issue deletion | POST-V1. |
| Sprint selection on creation | POST-V1. |
| Registration | POST-V1. |
| Issue activity on issue detail | POST-V1. |
| Comment edit and delete | POST-V1. |

### Resolved by accepted architecture decisions

| Earlier question | Resolution |
| --- | --- |
| Session persistence (formerly open question 5) | **The product behaviour is resolved** in [`ARCHITECTURE.md`](./ARCHITECTURE.md) §8. The credential persists across normal app relaunch. On startup, a stored credential is validated with `GET /auth/me` before protected content is shown. An invalid or expired credential is deleted and the user is signed out. A 401 is the central session-expiry signal. Local sign-out deletes the credential but does not revoke it server-side. **The concrete secure credential-storage mechanism remains undecided.** It is a later dependency decision (`ARCHITECTURE.md`, Deferred decisions). |

---

## I. Out of Scope for V1

- **V1 non-goals:**
  - reproducing every web screen
  - full web parity
  - modifying or extending the backend
  - public App Store distribution
  - advanced administrative configuration
  - making push notifications a release dependency
  - expanding features without demonstrated mobile value
- **Deferred beyond V1:** every capability in §E.
- **Not introduced:** recently viewed, pinned, or history features. "Recent context" means only
  remembering the last-used accessible workspace/project locally (§C.2).
- **Undecided** (neither included nor excluded):
  - offline functionality
  - tablet optimization
  - advanced reporting
- **Not supported by the backend:** see §G. These are technical constraints, not product-level
  exclusions.
