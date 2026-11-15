# B4F Board Mobile — API Contract

| Field | Value |
| --- | --- |
| Date | November 15, 2026 |
| Scope | The current foundation slice only: login, session validation, My Issues, read-only issue detail ([`ROADMAP.md`](./ROADMAP.md), Milestone 1) |
| Backend | `b4f-board-final/api` (NestJS). Fixed; never modified by this app. |
| Evidence level | **Source-verified** against the real backend code. **Runtime verification pending** (see §7). |
| Related | [`ARCHITECTURE.md`](./ARCHITECTURE.md) §4, §5, §17; [`CAPABILITY_MATRIX.md`](./CAPABILITY_MATRIX.md) |

This is the contract the app's API layer may rely on for the current slice (`ARCHITECTURE.md`
§4). It lists only the endpoints this slice uses. Endpoints for later slices are added here before
the slice that relies on them. Nothing in this document is invented. Every statement cites the
backend source file it was confirmed in, and anything inferred from framework defaults is marked
**[runtime verification required]**.

---

## 1. Conventions that apply to every endpoint below

- **Base path.** There is no global path prefix or versioning. Paths start at the backend origin
  (`api/src/main.ts`).
- **Authentication.**
  - Protected endpoints require `Authorization: Bearer <accessToken>`
    (`ExtractJwt.fromAuthHeaderAsBearerToken()`, `api/src/auth/jwt.strategy.ts:19`).
  - Expired tokens are rejected (`ignoreExpiration: false`, `:20`).
  - Token lifetime is `JWT_EXPIRES_IN`, defaulting to `8h` (`api/src/auth/auth.module.ts:20`).
- **Request validation** (`api/src/main.ts:14-20`). A global `ValidationPipe` runs with
  `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`. A request body containing
  properties not declared in the DTO is rejected with 400.
- **Error body** (`api/src/common/filters/http-exception.filter.ts:45-51`). Every error response
  is:

  ```
  {
    statusCode: number,
    message: string | string[],
    error: string,
    path: string,
    timestamp: string
  }
  ```

  - `message` is an array for validation errors and a string otherwise.
  - The API layer normalizes it (`ARCHITECTURE.md` §5).
  - Clients rely on `statusCode`, not on the `error` text (see §7).

---

## 2. Shared shape: `IssueFields`

These are the scalar fields of the `Issue` model (`api/prisma/schema.prisma`, model `Issue`). Both
issue endpoints below return these fields.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string (UUID) | |
| `projectId` | string (UUID) | |
| `key` | string | Unique within its project |
| `title` | string | |
| `description` | string \| null | |
| `status` | `'TODO' \| 'IN_PROGRESS' \| 'REVIEW' \| 'DONE'` | Enum `IssueStatus` |
| `priority` | `'LOW' \| 'MEDIUM' \| 'HIGH' \| 'URGENT'` | Enum `IssuePriority` |
| `assigneeId` | string (UUID) \| null | |
| `reporterId` | string (UUID) \| null | |
| `storyPoints` | number (integer) \| null | `null` means not estimated; `0` is a real value |
| `sprintId` | string (UUID) \| null | `null` means backlog |
| `createdAt` | date | Serialized as an ISO-8601 string **[runtime verification required]** |
| `updatedAt` | date | Serialized as an ISO-8601 string **[runtime verification required]** |

---

## 3. `POST /auth/login`

Source: `api/src/auth/auth.controller.ts:19-23`, `api/src/auth/dto/login.dto.ts`,
`api/src/auth/auth.service.ts:35-59`.

| | |
| --- | --- |
| Method / path | `POST /auth/login` |
| Auth | None |
| Request body | `{ email: string, password: string }` |
| Validation | `email`: must be a valid email (`@IsEmail`). `password`: string, at least 1 character (`@IsString`, `@MinLength(1)`). Undeclared properties are rejected. |
| Success | `200` (explicit `@HttpCode(200)`) |
| Response body | `{ accessToken: string, user: { id: string, name: string, email: string } }` |

**Errors**

| Status | When | `message` |
| --- | --- | --- |
| 401 | Unknown email **or** wrong password. The two cases are indistinguishable. | `"Invalid email or password"` |
| 400 | Request body fails validation | Array of validation messages |

**Token.** The JWT payload is `{ sub: <user id>, email }` (`auth.service.ts:50-53`). The app treats
the token as opaque and does not decode it (`ARCHITECTURE.md` §8).

---

## 4. `GET /auth/me`

Source: `api/src/auth/auth.controller.ts:25-30`, `api/src/auth/jwt.strategy.ts:28-37`.

Used to confirm that a stored session is still valid (`ARCHITECTURE.md` §8).

| | |
| --- | --- |
| Method / path | `GET /auth/me` |
| Auth | Bearer token (`JwtAuthGuard`) |
| Request | No body, no params, no query |
| Success | `200` |
| Response body | `{ id: string, email: string, name: string }` |

The user is looked up again on every authenticated request, so the response reflects the current
record (`jwt.strategy.ts:29-32`).

**Errors**

| Status | When | `message` |
| --- | --- | --- |
| 401 | Token missing, malformed, invalid signature, or expired | Framework default **[runtime verification required]** |
| 401 | Token valid but the user no longer exists | `"User no longer exists"` (`jwt.strategy.ts:34`) |

---

## 5. `GET /users/me/issues`

Source: `api/src/users/users.controller.ts:26-29`, `api/src/users/users.service.ts:55-72`.

| | |
| --- | --- |
| Method / path | `GET /users/me/issues` |
| Auth | Bearer token (`JwtAuthGuard` on the controller class) |
| Request | No body, no params, no query |
| Success | `200` |
| Response body | `Array<IssueFields & { project: { id: string, key: string, name: string, workspaceId: string } }>` |

**Which issues are returned**

- Only issues where `assigneeId` is the current user.
- Only issues in a workspace where the current user is **still a member**. The membership check
  runs in the database query itself (`users.service.ts:57-66`).

**Ordering, limits, and omissions**

- Ordered by `updatedAt` descending (`:67`). This is the backend's only order. It is used as the
  interim order; the product prioritization rule is still undecided (`MOBILE_SCOPE.md` §H, open
  question 2).
- No pagination, no limit, no filters. No query parameters are accepted.
- No results returns `[]`.
- The response does **not** include `assignee`, `reporter`, or `sprint` objects (`:68-70`).

**Errors**

| Status | When | `message` |
| --- | --- | --- |
| 401 | No valid token | As in §4 |

---

## 6. `GET /issues/:id`

Source: `api/src/issues/issues.controller.ts:54-57`, `api/src/issues/issues.service.ts:34-41`
(`getIssueOrThrow`), `:184-198` (`findOne`), and
`api/src/workspaces/workspace-access.service.ts:21-29` (`requireMembership`).

| | |
| --- | --- |
| Method / path | `GET /issues/:id` |
| Auth | Bearer token (`JwtAuthGuard` on the controller class) |
| Path params | `id`: must be a UUID (`ParseUUIDPipe`) |
| Request | No body, no query |
| Success | `200` |

**Response body**

```
IssueFields & {
  assignee: { id: string, name: string } | null,
  reporter: { id: string, name: string } | null,
  project: { id: string, key: string, name: string, workspaceId: string },
  _count: { comments: number }
}
```

The response has no `sprint` object and does not include comments.

**Errors (checked in this order)**

| Status | When | `message` |
| --- | --- | --- |
| 400 | `:id` is not a UUID | Framework default from `ParseUUIDPipe` **[runtime verification required]** |
| 401 | No valid token | As in §4 |
| 404 | **The issue does not exist** (`getIssueOrThrow`) | `"Issue not found"` |
| 404 | **The issue exists but the caller is not a member of its workspace** (`requireMembership`) | `"Workspace not found"` |

Both 404s mean "not found" to the app (`ARCHITECTURE.md` §5). The message tells the two cases
apart, but the app must not present them as different situations to the user.

---

## 7. Runtime verification required

The following were inferred from framework or runtime defaults, not read directly in backend code.
Each must be confirmed against the running backend during this slice (`ARCHITECTURE.md` §17,
`ROADMAP.md` Milestone 0). If any differs, this document is corrected before the code relies on
it.

1. **The 401 body for a missing, invalid, or expired token.** It is produced by the Passport/Nest
   guard defaults, not an explicit backend message. Its `message` and `error` values are
   unconfirmed, and `error` likely differs from the explicit 401s above.
2. **Real token expiry** after `JWT_EXPIRES_IN` (default `8h`) produces a 401 on `GET /auth/me`
   and other protected endpoints.
3. **The 400 body for a non-UUID `:id`**, which is the `ParseUUIDPipe` default message.
4. **Date serialization**: `createdAt` and `updatedAt` arrive as ISO-8601 strings.
5. **All success shapes above** match what the running backend actually returns.

---

## 8. Known differences from other documents

Recorded here only. The other documents are not changed by this file.

- **404 wording for an inaccessible issue.** `CAPABILITY_MATRIX.md` and `ROADMAP.md` (Milestone 1)
  describe it only as 404 "Workspace not found". The source distinguishes two cases: 404 "Issue
  not found" for a non-existent issue, and 404 "Workspace not found" for a non-member (§6).
