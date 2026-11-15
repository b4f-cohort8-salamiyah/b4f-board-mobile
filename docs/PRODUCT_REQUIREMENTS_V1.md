# B4F Board Mobile — Product Requirements V1

| Field | Value |
| --- | --- |
| Source | Product Brief v0.1 |
| Brief approval | Approved on November 15, 2026 |
| Platform | React Native / Expo — iOS-first |
| Product type | Mobile companion for B4F Board |
| Development status | Not started |
| Backend constraint | Existing NestJS API must remain unchanged |
| Lifecycle status | Product discovery and engineering-governance definition complete; technical design pending |
| Runtime API verification | Pending |
| Implementation authorization | **Not granted** |

---

## 0. About This Document

This document records the product requirements for B4F Board Mobile V1 exactly as approved in
Product Brief v0.1. It preserves the approved product intent and separates **confirmed decisions**
from **genuinely unresolved questions**.

This document deliberately does **not** contain:

- application architecture or technical design
- library, framework-module, or dependency choices
- claims about what the existing NestJS API does or does not support
- feasibility judgements about any capability
- per-capability mobile classification (for example CORE / MOBILE-ADAPTED / EXCLUDED / POST-V1),
  which is recorded in [`MOBILE_SCOPE.md`](./MOBILE_SCOPE.md)

> **Classification and verification status.** The accepted per-capability mobile classification
> is recorded in `MOBILE_SCOPE.md`. The existing API has been inspected at source level
> ([`CAPABILITY_MATRIX.md`](./CAPABILITY_MATRIX.md)). **Runtime API verification remains
> pending.** No capability in this document should be read as runtime-verified against the
> existing API until that verification is complete and documented.

> **No implementation authorization.** No architecture design, development, or repository changes
> should begin until explicitly requested.

---

## 1. Product Goal

B4F Board Mobile is an issue-centric, action-first mobile application designed to help team
members quickly check their assigned work, respond to updates, and perform everyday
issue-management activities from their phones.

The application should provide a faster, simpler, and more touch-friendly alternative to the
existing Next.js web experience rather than reproduce its interface.

**Core value proposition:** Understand what needs attention, access relevant context, and act
quickly.

## 2. Target Users

**Primary users:** Team members who manage assigned issues, update their progress, and
collaborate through comments and mentions.

**Secondary users:** Project managers and workspace administrators who need occasional access to
project information and issue-management workflows.

All mobile functionality must respect existing roles and permissions.

## 3. Core Mobile Journeys

### 3.1 Review Assigned Work

- Open the application directly to My Issues.
- View assigned issues in a prioritized order.
- Quickly identify work requiring attention.
- Navigate directly to relevant issue details.

### 3.2 Manage Issues

- View issue details and relevant context.
- Change issue status.
- Edit permitted issue fields.
- Create issues quickly.
- Access additional creation fields when needed.

Issue deletion is not part of V1; it is classified POST-V1 (see §7.1).

### 3.3 Collaborate

- Read issue comments.
- Add comments and continue issue discussions.
- Mention relevant teammates.
- Understand relevant issue context through comments, mentions, and current issue state.

### 3.4 Interact With Project Boards

- Navigate project boards using touch-friendly interactions.
- View issues grouped by their workflow status.
- Perform quick issue actions.
- Use touch-friendly board interactions, with tap-based status changes; drag-and-drop is deferred beyond V1.

### 3.5 Respond to Urgent Updates

- Quickly access issues requiring attention.
- Review sufficient context before acting.
- Update issue status or communicate through comments.

Push notifications and configurable notification preferences are deferred beyond V1.

## 4. Mobile Experience Principles

| Principle | Requirement |
| --- | --- |
| Speed first | Common actions should require minimal navigation and interaction. |
| Issue-centric | Assigned work and issue management take priority over administrative functionality. |
| Touch-friendly | Navigation and interactions must be designed specifically for mobile devices. |
| Progressive disclosure | Keep simple actions immediately accessible while revealing advanced options when needed. |
| Contextual | Provide enough information to support informed decisions without overwhelming the interface. |
| Polished | Deliver smooth transitions, responsive feedback, clear states, and consistent interactions. |
| Permission-aware | Respect existing backend authorization and user roles. |
| Not a web clone | Mobile workflows and navigation may intentionally differ from the desktop experience. |

## 5. Constraints

- The existing NestJS backend is fixed and must not be modified.
- No new backend endpoints or changes to existing API behavior are permitted.
- Actual API capabilities must be verified separately.
- Existing web functionality does not automatically qualify for mobile.
- React Native / Expo is the selected mobile development framework.
- iOS is the initial target platform.
- V1 distribution is limited to local development, simulator testing, and physical-device
  testing.
- Development time is limited; scope must remain focused.

---

## 6. Confirmed Decisions

The following are approved and not open for reinterpretation in this document.

### 6.1 Product direction

B4F Board Mobile V1 will be a focused, issue-centric, action-first iOS application that helps team
members manage their work and collaborate efficiently.

It will prioritize My Issues, fast issue actions, comments, mentions, and mobile-friendly project
boards.

The experience must be intentionally designed for mobile rather than copied from the existing web
application.

The existing backend remains an absolute constraint.

### 6.2 V1 — Essential Capabilities

1. Authentication and session management.
2. My Issues as the default opening screen.
3. Issue details.
4. Issue status updates.
5. Quick issue creation with expandable details.
6. Issue editing.
7. Comments and mentions.
8. Touch-friendly project board with hybrid interaction.

All V1 capabilities are subject to verification against existing API contracts and permissions.

### 6.3 Post-V1 Candidates (deferred)

- Push notifications and notification preferences.
- Sprints and backlog management.
- Workspace and project management.
- Workspace and project member management.
- Dedicated activity experience.
- User profile management.

These capabilities are deferred, not permanently excluded from the mobile product.

### 6.4 Explicit Non-Goals

V1 will not aim to:

- Reproduce every Next.js web screen.
- Achieve complete feature parity with the web application.
- Modify or extend the NestJS backend.
- Introduce public App Store distribution.
- Implement advanced administrative configuration.
- Make push notifications a first-release dependency.
- Expand functionality without demonstrated mobile user value.

### 6.5 Fixed platform and distribution decisions

- Framework: React Native / Expo.
- Initial target platform: iOS.
- V1 distribution: local development, simulator testing, and physical-device testing only.

---

## 7. Unresolved Questions

These items are genuinely open. They are recorded here as questions, not as decisions, and must
not be resolved by assumption.

### 7.1 Former V1 candidates — resolved

These were V1 candidates in Product Brief v0.1. The accepted capability classification
(`MOBILE_SCOPE.md`) resolves all three:

| Former candidate | Resolution |
| --- | --- |
| Issue deletion | POST-V1 |
| In-app visibility of issue updates | POST-V1, as in-app notifications and notification management |
| Specific drag-and-drop board interactions | POST-V1 |

**No V1 candidates remain open.**

### 7.2 Undecided (neither included nor explicitly excluded)

- Offline functionality.
- Tablet optimization.
- Advanced reporting.

### 7.3 Risks and open questions

| Topic | Open question |
| --- | --- |
| **Existing API compatibility — highest risk** | Desired mobile interactions may not be fully supported by the current NestJS API. Existing endpoints, authorization rules, and response contracts must be verified before technical design. |
| Issue prioritization | The ordering and filtering rules for My Issues remain undefined. |
| Scope and timeline | Development time is limited, but no formal deadline or effort budget has been established. |

### 7.4 Capability classification and API verification status

- Detailed mobile capability classification (CORE / MOBILE-ADAPTED / PRODUCT-LEVEL EXCLUDED /
  POST-V1) is complete. It is recorded in `MOBILE_SCOPE.md`, which also records how the former
  V1 candidates in §7.1 were classified.
- The existing API has been inspected at source level (`CAPABILITY_MATRIX.md`). Runtime
  verification of endpoints, authorization rules, and response contracts **remains pending**.

---

## 8. Definition of Done

B4F Board Mobile V1 will be considered complete when:

1. All approved V1 journeys work end-to-end against the existing API.
2. Users can authenticate and maintain sessions correctly.
3. My Issues presents a useful, prioritized view of assigned work.
4. Users can create, view, and edit issues and update their status within existing permissions.
5. Comments and mentions support the approved collaboration journeys.
6. The approved board interactions work reliably.
7. Loading, empty, error, and success states are handled consistently.
8. Navigation and interactions deliver a polished, purpose-built iOS experience.
9. All approved journeys are validated in the iOS simulator and on a physical device.
10. The backend remains unchanged.
11. Any API limitations or blocked requirements are explicitly reviewed and documented.

**Success criterion:** Complete, reliable, and polished mobile journeys — not the number of
features or screens delivered.

---

## 9. Lifecycle Status

**Complete:**

- Product discovery (this document).
- Existing product and API capability inspection at source level (`CAPABILITY_MATRIX.md`).
- Mobile capability classification and scope (`MOBILE_SCOPE.md`).
- Delivery roadmap (`ROADMAP.md`).
- Engineering-governance definition (`ENGINEERING_STANDARDS.md`).

**Pending:**

- Technical design.
- Runtime API verification (`ROADMAP.md`, Milestone 0).

**Development status:** Not started.

**Implementation authorization:** Not granted. No architecture design, development, or repository
changes should begin until explicitly requested.
