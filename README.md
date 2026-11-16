# B4F Board Mobile

A React Native / Expo mobile companion for **B4F Board**, built iOS-first on top of the
existing, fixed NestJS backend. Built incrementally during **B4F Cohort 8 Salamiyah**.

## What is B4F Board Mobile?

B4F Board already exists as a web product with a real backend and a real database. This
repository is not a port of that desktop application — it is an exploration of what a focused,
mobile-first version of the same product should look like.

The mobile app is meant to be:

- faster to use for everyday work than opening the website on a small screen;
- simpler, showing only what's needed for the most common phone tasks;
- touch-friendly, using native mobile patterns instead of copying desktop UI;
- focused on the workflows people actually reach for on a phone: checking assigned work,
  reading an issue, and acting on it quickly.

The backend is never modified by this project. Everything the app does goes through the
existing, documented API.

## Product direction

The approved V1 scope for the mobile app is:

- **Authentication and session continuity** — sign in, stay signed in, handle an expired session.
- **My Issues** — the issues assigned to the signed-in user.
- **Issue Detail** — full issue information, read and act on one issue.
- **Issue management** — create an issue, edit it, change its status, priority, and assignee.
- **Project board** — a touch-friendly, status-grouped board for a project.
- **Comments and collaboration** — read and add comments, and mention teammates.

Note: drag-and-drop is **not** required for V1. Status changes on the board use a tap-based
action instead.

The following are real, accepted product areas that are intentionally **post-V1** (deferred, not
excluded): activity feeds, sprints/backlog, workspace administration, and project/member
administration.

## Current repository status

**Session 29 was delivered partially**, through the real end of its fourth live-coding step
(LC-04). The sections below describe exactly what that means.

### Implemented so far

- Secure credential persistence, using `expo-secure-store`.
- Environment/API-base configuration, read from one place.
- A single, typed API boundary — no screen calls the network directly.
- Login.
- Session restoration on app relaunch.
- Invalid/expired session handling (the stored credential is cleared and the user is signed out).
- Temporary backend/network failure handling (the credential is kept, and the app offers a retry
  — it does not sign the user out just because a request failed to reach the server).
- Public vs. protected navigation, separated by a single guard.
- My Issues.
- Read-only Issue Detail.
- Status/priority UI semantics (colors and labels, matching the real web product).
- Expo starter template cleanup.
- API-boundary lint rules (enforcing the single API client, the single config module, and the
  single credential-store module).

### Slice 1 is still incomplete

The first real foundation slice (login → session restoration → My Issues → Issue Detail) is
**not yet finished**. The remaining engineering work is:

- Fixing the two existing TypeScript errors (see [Quality checks](#quality-checks)).
- Selecting and installing a test runner.
- Writing the required tests: the config/API-base validator, the API client/error handling, the
  session state machine, and the issue-id check.
- Verifying the lint boundary rules actually fail on a real violation, not just that the tree is
  currently clean.
- Verifying the real API contract against the running backend and recording the result.
- A full simulator acceptance pass for everything in this first slice.

This list is deliberately scoped to finishing the first slice only — it does not include issue
creation, the project board, or comments. Those are real, accepted, later work.

## Architecture

```text
Expo / React Native
        |
Session + Feature Screens
        |
Typed API Client
        |
Existing NestJS API
        |
Existing Database
```

- **Expo Router** is the only navigation system, with public (sign-in) and authenticated routes
  separated by a single guard.
- **My Issues** is the primary authenticated screen — the app opens here once signed in.
- **One typed API client** is the only part of the app that talks to the network.
- **One React Context session owner** tracks whether the user is signed in, signed out, or still
  being checked — nothing else decides this independently.
- **One credential-store abstraction** is the only module allowed to touch secure storage.
- **The backend is never changed.** The app adapts to the existing API; the API does not adapt to
  the app.

## Authentication and session behavior

On every app launch:

| Stored credential | What happens |
| --- | --- |
| None | Show the sign-in screen. |
| Valid | Restore the session; go straight to My Issues. |
| Invalid or expired | Clear the stored credential and show the sign-in screen. |
| Backend or network temporarily unreachable | **Keep** the stored credential; show a retry screen instead of signing out. |

The last case matters: a slow or dropped connection is not the same thing as a logged-out user.
Treating a temporary network failure as a sign-out would force people to log in again every time
their phone loses signal for a moment — so the app only clears the credential when the backend
explicitly says the session is no longer valid.

## Project structure

```text
src/
  api/          typed API client, request/response types, one function per backend endpoint
  app/          Expo Router routes (file-based) — public routes, and the authenticated (app) group
  components/   shared UI building blocks (themed text/view, screen states, tabs)
  config/       the one module that reads environment configuration
  constants/    theme tokens (colors, spacing, typography)
  features/
    auth/       session state, session provider, credential store, sign-in and reconnect screens
    my-issues/  the My Issues screen and its data hook
    issues/     issue detail, status/priority badges, the issue-id check
  hooks/        small shared hooks (e.g. color scheme)
```

## Getting started

**Prerequisites:** Node.js (matching the version this Expo SDK expects), and either Xcode with
the iOS Simulator, or a physical iOS device.

```bash
npm install
```

Copy the example environment file and set the backend address:

```bash
cp .env.example .env.local
```

`EXPO_PUBLIC_API_BASE_URL` must be an absolute `http://` or `https://` URL with **no trailing
slash**. The iOS Simulator can reach your Mac's `localhost`. A physical device cannot — it needs
your Mac's real LAN address instead (for example `http://192.168.1.20:4000`).

Start the app:

```bash
npx expo start
```

Then press `i` to launch the iOS Simulator (or scan the QR code with a physical device running
Expo Go, keeping the LAN-address rule above in mind).

## Quality checks

```bash
npx expo lint
npx tsc --noEmit
```

`npx expo lint` is currently clean.

`npx tsc --noEmit` currently reports **two known errors**, both in
`src/components/app-tabs.web.tsx` — a web-only file not used by the real mobile app. These are
tracked as real, open work in `docs/SLICE_1_REMAINING_WORK-EN.pdf`, not hidden.

There is **no test runner installed yet**. Selecting one, and writing the tests this slice
already requires, is part of the remaining Slice 1 work above.

## Student documentation

Two PDF guides document the real engineering process behind this repository:

- **[Engineering Workflow Guide](docs/B4F_BOARD_MOBILE_ENGINEERING_WORKFLOW_GUIDE-EN.pdf)** —
  the Session 28 → Session 29 journey: how the product was scoped, how the backend was verified,
  how the architecture was decided, and how the first slice was actually implemented, with the
  reasoning behind each decision.
- **[Slice 1 Remaining Work](docs/SLICE_1_REMAINING_WORK-EN.pdf)** — a self-guided exercise for
  finishing the first slice: the exact, genuine work listed under
  [Slice 1 is still incomplete](#slice-1-is-still-incomplete) above, one step at a time.

## Learning goals

Working through this repository is meant to teach how to:

- turn product requirements into a small, real implementation slice;
- inspect an existing backend before designing a client against it;
- define architectural boundaries before writing feature code;
- separate authentication failures from temporary network failures;
- centralize API access behind one typed boundary;
- use secure, platform-appropriate credential storage;
- verify assumptions with tests and real runtime evidence, not assumptions;
- use Git checkpoints to preserve a real, honest engineering history.

## Repository history

The Git history intentionally preserves real classroom milestones rather than being squashed into
one commit:

1. The initial Expo project scaffold.
2. The Session 28 engineering-foundation freeze — product scope, architecture, API contract, and
   the accepted implementation plan, with no feature code yet.
3. The Session 29 foundation implementation — the real code described above.

This history is not rewritten or squashed as the project continues.

## Backend

This repository consumes the existing B4F Board backend (NestJS) as a fixed, external dependency.
Backend changes are explicitly outside the mobile V1 scope — if the backend can't support
something, that is recorded as a known constraint, not worked around on the server.
