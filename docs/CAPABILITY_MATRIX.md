# B4F Board Mobile — Existing Product & API Capability Matrix

| Field | Value |
| --- | --- |
| Phase | Existing Product & API Capability Discovery |
| Status | Source inspection complete; **runtime verification pending** |
| Date | November 15, 2026 |
| Related | [`PRODUCT_REQUIREMENTS_V1.md`](./PRODUCT_REQUIREMENTS_V1.md) |
| Web app inspected | `b4f-board-final/web` (Next.js), read-only |
| Backend inspected | `b4f-board-final/api` (NestJS), read-only |
| Implementation authorization | **Not granted** |

---

## 0. About This Document

This document combines two read-only inspections of the existing product:

- **Web app:** what a logged-in user can actually do in the Next.js UI.
- **Backend:** what the NestJS API actually exposes.

For every real product capability, it records whether the backend supports it. It also flags
where the web app does something the backend does not support, and separates out the
**mobile-local concerns**: things a phone app handles on the device, which need no backend
support.

**Evidence level.**

- Findings come from reading source code only. Neither codebase was run, and the backend's
  integration tests were not executed.
- Items marked *(unverified)* or *(inferred)* were deduced from code, not observed.

This document deliberately does **not**:

- propose application architecture, libraries, or dependencies
- propose backend changes. The backend is fixed (see `PRODUCT_REQUIREMENTS_V1.md` §5)
- classify capabilities for mobile (for example CORE / MOBILE-ADAPTED / EXCLUDED / POST-V1). The
  accepted classification is recorded in [`MOBILE_SCOPE.md`](./MOBILE_SCOPE.md). It is based on
  this source-inspected matrix; runtime verification remains pending.
- describe theme behaviour or colour choices, which were out of scope for the inspection

### Legend

| Mark | Meaning |
| --- | --- |
| ✅ | The backend supports it and the web app uses it |
| 🟦 | The backend supports it; the web app does not use it |
| ◐ | Partly supported, or only by combining several calls on the client |
| ❌ | Not supported by the backend |
| ⚠️ | The web app does something the backend does not support |
| — | Not present in the web UI |

---

## 1. Backend Facts That Apply Everywhere

### Request basics

- **Base paths:** no global path prefix and no API versioning. Routes start at the root (for
  example `/auth/login`). The default port is 4000.
- **Authentication:** every route except register and login requires
  `Authorization: Bearer <JWT>`. The API has no cookie authentication; the web app's 8-hour
  HttpOnly cookie is added by its own Next.js server.
- **Permission checks:** these happen inside the services, not through role decorators.

### Errors

- **Error shape:** every error looks like
  `{ statusCode, message (string | string[]), error, path, timestamp }`.
- **Unhandled database errors:** for example a uniqueness conflict, these return a generic 500.
- **Access errors:**
  - a non-member gets **404 "Workspace not found"**, even on project, issue, and comment URLs
  - a member without the required role gets 403
  - a non-UUID `:id` gets 400

### Other

- **Not present:** rate limiting, `helmet`, compression, and a custom body-size limit.
- **CORS:** allows a single origin (`WEB_ORIGIN`).
- **API documentation:** Swagger is served at `/api/docs`.
- **Allowed values:**

  | Field | Values |
  | --- | --- |
  | Issue status | `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE` (default `TODO`) |
  | Issue priority | `LOW`, `MEDIUM`, `HIGH`, `URGENT` (default `MEDIUM`) |
  | Workspace role | `OWNER`, `ADMIN`, `MEMBER` |
  | Sprint status | `PLANNED`, `ACTIVE`, `COMPLETED` |

---

## 2. Capability Matrix

### A. Authentication and Session

| Capability | Web | Backend | Notes |
| --- | --- | --- | --- |
| Register | ✅ | ✅ `POST /auth/register` | Returns the user **without a token**, so a separate login is required |
| Log in | ✅ | ✅ `POST /auth/login` | Returns `{accessToken, user:{id,name,email}}`. The JWT lasts 8 hours by default |
| Get the current user | ✅ | ✅ `GET /auth/me` | Returns `{id, email, name}` |
| Log out | ✅ | ❌ | ⚠️ The web app only deletes its cookie. The API has no logout route and cannot revoke a token, which stays valid until it expires |
| Renew a session | — | ❌ | No refresh tokens. After expiry the user must log in again |
| Revoke tokens after a password change | — | ❌ | Existing tokens keep working |

### B. Workspaces and Members

| Capability | Web | Backend | Notes |
| --- | --- | --- | --- |
| List workspaces | ✅ | ✅ `GET /workspaces` | Includes `myRole` and counts. No limit |
| Create a workspace | ✅ | ✅ `POST /workspaces` | Any user. The creator becomes OWNER |
| View a workspace | ✅ | ✅ `GET /workspaces/:id` | Non-members get 404 |
| Rename a workspace | — | 🟦 `PATCH /workspaces/:id` | Name only (OWNER or ADMIN). The slug cannot be changed |
| Delete a workspace | — | 🟦 `DELETE /workspaces/:id` | OWNER only. Deletes everything inside it |
| List members | ✅ | ✅ `GET /workspaces/:id/members` | No limit |
| Search users to add | ✅ | ✅ `GET /users/search` | `q` must be at least 2 characters. At most 10 results. Excludes existing members by default |
| Add a member | ✅ | ✅ `POST /workspaces/:id/members` | By email (OWNER or ADMIN). The new member's role is always MEMBER |
| Change a member's role | ✅ | ✅ `PATCH /workspaces/:id/members/:userId` | OWNER only, between ADMIN and MEMBER |
| Remove a member | ✅ | ✅ `DELETE /workspaces/:id/members/:userId` | Follows the owner/admin hierarchy. The removed member is not notified |
| Leave a workspace | — | ❌ | No route |

### C. Projects

| Capability | Web | Backend | Notes |
| --- | --- | --- | --- |
| List projects | ✅ | ✅ `GET /workspaces/:wid/projects` | Includes the issue count. No limit |
| Create a project | ✅ | ✅ `POST /workspaces/:wid/projects` | OWNER or ADMIN. The key (`^[A-Z][A-Z0-9]{1,9}$`) cannot be changed later |
| View a project | ✅ | ✅ `GET /projects/:id` | |
| Edit a project | — | 🟦 `PATCH /projects/:id` | Name and description (OWNER or ADMIN) |
| Delete a project | — | 🟦 `DELETE /projects/:id` | OWNER or ADMIN |
| Issue count per status | ✅ | ◐ | No count endpoint exists. The web app works it out from the full issue list, which has no limit |

### D. Issues

| Capability | Web | Backend | Notes |
| --- | --- | --- | --- |
| List a project's issues | ✅ | ✅ `GET /projects/:pid/issues` | Filters: `status`, `priority`, `assignee`, `sprintId`, `backlog=true`, `q` (title or key). Fixed order: newest created first. No pagination, no limit |
| My Issues (assigned to me) | ✅ (dashboard) | ◐ `GET /users/me/issues` | No filters, no limit. Fixed order: most recently updated first. Includes project info, but no assignee, reporter, or sprint objects |
| Issues reported by me | — | ❌ | No route |
| Find an issue by key (e.g. `WEB-42`) | — | ❌ | Issues are fetched by UUID only |
| View an issue | ✅ | ✅ `GET /issues/:id` | Includes assignee, reporter, project, and comment count. No sprint object |
| Create an issue | ✅ | ✅ `POST /projects/:pid/issues` | Any member. Status cannot be set on creation; it always starts as `TODO` |
| Change status | ✅ | ✅ `PATCH /issues/:id` | Assignee, reporter, OWNER, or ADMIN. Any status may move to any other |
| Change priority, assignee, or story points | ✅ | ✅ `PATCH /issues/:id` | Same permission rule |
| Edit the description | ✅ | ✅ `PATCH /issues/:id` | Every mention in the new text is notified again on each edit |
| Edit the title | — | 🟦 `PATCH /issues/:id` | |
| Delete an issue | ✅ | ✅ `DELETE /issues/:id` | Assignee, reporter, OWNER, or ADMIN |
| Response after create or edit | — | ◐ | `POST` and `PATCH` return the bare issue, without the related objects that `GET` includes |
| Sending `null` for a required field | — | *(unverified)* | The update accepts `null` for title, status, or priority. This probably causes a 500 |

### E. Board

| Capability | Web | Backend | Notes |
| --- | --- | --- | --- |
| Board for the active sprint | ✅ | ◐ | Built by combining calls: list sprints, find the active one, then list its issues |
| Search and filter on the board | ✅ | ✅ | Uses the project issues filters |
| Drag and drop to change status | ✅ | ✅ (status update only) | The drag is entirely client-side. The backend only receives the status change |

### F. Sprints and Backlog

| Capability | Web | Backend | Notes |
| --- | --- | --- | --- |
| List sprints with point totals | ✅ | ✅ `GET /projects/:pid/sprints` | No limit |
| View a sprint | ✅ | ✅ `GET /sprints/:id` | |
| Create a sprint | ✅ | ✅ `POST /projects/:pid/sprints` | OWNER or ADMIN |
| Edit a sprint | ✅ | ✅ `PATCH /sprints/:id` | OWNER or ADMIN. Completed sprints cannot be edited. Dates cannot be cleared once set *(unverified)* |
| Start or complete a sprint | ✅ | ✅ `POST /sprints/:id/start`, `POST /sprints/:id/complete` | OWNER or ADMIN. Only one sprint may be active (409 otherwise). Completing a sprint does not move its unfinished issues |
| Delete a sprint | — | ❌ | No route |
| Move an issue to a sprint or the backlog | ✅ (shown to every member) | ✅ `PATCH /issues/:id` (assignee, reporter, OWNER, ADMIN) | ⚠️ The web app offers this to every member, but the backend refuses members who are not the assignee or reporter (403) |
| Put an issue into a completed sprint | (hidden by the web app) | Not blocked *(unverified)* | |

### G. Comments and Mentions

| Capability | Web | Backend | Notes |
| --- | --- | --- | --- |
| Read comments | ✅ | ✅ `GET /issues/:iid/comments` | Oldest first. No limit. The author can be `null` |
| Add a comment | ✅ | ✅ `POST /issues/:iid/comments` | Any member. Up to 3000 characters |
| Reply to a comment (threaded) | — | ❌ *(inferred)* | The returned comment has no parent field, so comments are flat |
| Edit a comment | — | 🟦 `PATCH /comments/:id` | Author, OWNER, or ADMIN. Mentions are notified again on every edit. There is no "edited" marker, because comments have no `updatedAt` |
| Delete a comment | ✅ | ✅ `DELETE /comments/:id` | Author, OWNER, or ADMIN |
| Mention a teammate | ✅ | ✅ | The text must contain `@[Display Name](<uuid>)`; only the UUID matters. Mentioning a non-member returns 400 |
| Search for people to mention | ✅ | ✅ `GET /users/search?…&membersOnly=true` | `q` must be at least 2 characters. ⚠️ The web app searches from 1 character, which always returns no results |

### H. Activity, Notifications, and Dashboard

| Capability | Web | Backend | Notes |
| --- | --- | --- | --- |
| Issue activity history | ✅ | ✅ `GET /issues/:id/activity` | Read-only. No limit |
| My activity | ✅ (shows 15) | ✅ `GET /users/me/activity` (50 most recent) | The web app trims the list itself |
| Workspace activity | — | 🟦 `GET /workspaces/:id/activity` | 50 most recent |
| List notifications (all or unread) | ✅ (bell shows 8) | ✅ `GET /notifications` (50 most recent) | No pagination |
| Unread count | ✅ | ✅ `GET /notifications/unread-count` | Available only by asking again (polling) |
| Mark one notification read | ✅ | ✅ `PATCH /notifications/:id/read` | |
| Mark all notifications read | ✅ | ✅ `POST /notifications/read-all` | |
| Mark a notification unread | — | ❌ | No route |
| Delete a notification | — | 🟦 `DELETE /notifications/:id` | |
| Notification on a status change | — | ❌ | Not one of the notification types |
| Real-time updates or push | — | ❌ | No WebSockets, server-sent events, or device tokens |

The backend creates notifications for these events:

- a mention
- being assigned an issue
- a comment on an issue you reported or are assigned to
- your workspace role changing
- being added to a workspace
- a sprint starting or completing

### I. Profile

| Capability | Web | Backend | Notes |
| --- | --- | --- | --- |
| Change name or password | ✅ | ✅ `PATCH /users/me` | A password change requires `currentPassword` |
| Change email | — | ❌ | |

### J. Not Present in Either the Web App or the Backend

- Favourites, pinned items, "recently viewed", or "last visited".
- Pagination of any kind, or a client-chosen sort order.
- "Changes since" requests, delta updates, or ETag support.
- `updatedAt` on comments, projects, workspaces, members, or notifications. Only issues and
  sprints have it.
- Attachments or file uploads.
- Rate limiting.

---

## 3. Web Behaviour the Backend Does Not Support (⚠️)

1. **Log out:** the web app only deletes its cookie. The server cannot revoke the token, which
   stays valid until it expires.
2. **Move issue to sprint:** offered to every member. The backend allows only the assignee,
   reporter, OWNER, or ADMIN.
3. **Mention search:** starts at 1 character, but the backend requires at least 2.

Everything else the web app shows is backed by real routes. Some screens combine several calls
(board, per-status counts); others trim longer lists (8 notifications, 15 activity entries).

---

## 4. Mobile-Local Concerns (Not Backend Features)

These belong on the device. None needs, or implies, a backend change or a new endpoint. They are
listed only to separate them from backend capability. How they are handled is a later design
decision.

- **Remembering what the user last looked at**, such as the last workspace, project, or issue,
  or a recently-viewed list. This is device-only state.
- **Login token on the device:**
  - keeping it on the device and removing it when the user logs out (the only logout the API
    allows)
  - detecting the 8-hour expiry or a 401 and sending the user back to login
- **Ordering or grouping My Issues.** The backend returns the full assigned list in one fixed
  order, so any other prioritization would be applied on the device. The prioritization rules
  remain an open product question.
- **Refreshing data:** manual refresh, refreshing when the app returns to the foreground, and
  re-requesting the unread count.
- **Request and response handling on the device:**
  - building the `@[Name](uuid)` mention text
  - waiting for typing to pause before searching
  - respecting the 2-character search minimum
  - merging the bare `POST`/`PATCH` issue responses into what is already shown
- **Touch interaction:** drag gestures, tap-target sizes, board layout, and how many fields are
  shown when creating an issue.
- **Draft comments and unsaved form input.**
- **Hiding actions the user's role cannot perform,** using the permission rules above. The
  backend enforces those rules regardless.
- **Offline caching,** if it is ever chosen. Offline functionality is still undecided.

---

## 5. Points Relevant to the Approved V1 Brief

These are flags for review only. They do not classify capabilities or resolve any open question
in `PRODUCT_REQUIREMENTS_V1.md`.

| V1 brief item | What the evidence shows |
| --- | --- |
| Authentication and session management | 8-hour Bearer tokens. No refresh, no server-side logout, no revocation |
| My Issues, prioritized | `GET /users/me/issues` returns the full list, most recently updated first, with no filters. The prioritization rules are still undefined |
| Issue details, status updates, editing | Supported, within the assignee / reporter / OWNER / ADMIN rule |
| Quick issue creation with expandable details | Supported. Status cannot be set on creation |
| Comments and mentions | Adding, reading, and deleting comments and mentioning are supported. **Threaded replies are not** *(inferred: no parent field)* |
| Touch-friendly board with hybrid interaction | Status updates are supported. Drag-and-drop is entirely client-side |
| Issue deletion (candidate) | Supported for the assignee, reporter, OWNER, and ADMIN |
| In-app visibility of issue updates (candidate) | Notifications and activity exist, retrieved by polling only. Status changes create no notification. No real-time updates |
| Respond to urgent updates | Same as above. Push is unavailable and is already deferred beyond V1 |

---

## 6. Open Verification Items

- Behaviour when `null` is sent for required issue fields (title, status, priority).
- Whether an issue can be added to a completed sprint.
- Whether sprint dates can be cleared.
- Framework defaults that were inferred rather than read in code:
  - the JWT algorithm
  - the default body-size limit
  - ETag behaviour
  - the Swagger JSON path
- Whether comments have a reply or parent concept. Inferred absent from the returned comment
  shape; not confirmed against the schema.
- The backend integration tests were not run, so the behaviour described here has not been
  observed at runtime.
