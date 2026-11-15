# B4F Board Mobile — Design Semantics

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | November 15, 2026 |
| Applies to | `src/constants/theme.ts` (existing theme), read through the existing `src/hooks/use-theme.ts` |
| Related | [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`ENGINEERING_STANDARDS.md`](./ENGINEERING_STANDARDS.md) §14 |

This document records how the B4F Board web app's real visual semantics carry over to the mobile
theme. It **extends** the existing Expo theme. It adds no new theme file or hook.

---

## 1. Source of truth for status and priority colours

**The colours rendered by the web app's `Badge.tsx` are the source of truth** for issue status and
priority (`b4f-board-final/web/src/components/ui/Badge.tsx`, `StatusBadge` and `PriorityBadge`).

The web app's `tailwind.config.ts` also declares single-hue `status` and `priority` palettes, but
**no class in the web source uses them**. They are not what users see, so they are not used here.

Hex values are the Tailwind v3 default palette values the badges use, read from the web app's
installed `tailwindcss` (^3.4.13).

---

## 2. Accepted status and priority tokens

Each status and priority value has a **background** token and a **text** token, in both light and
dark mode. They live as flat string keys in the existing `Colors.light` and `Colors.dark`. That
keeps `ThemeColor` a set of colour keys, so the tokens work with the existing `ThemedText`
(`themeColor`) and `ThemedView` (`type`) props.

### Status (`IssueStatus`)

| Backend value | Background token | Text token | Light background / text | Dark background / text |
| --- | --- | --- | --- | --- |
| `TODO` | `statusTodo` | `statusTodoText` | `#f3f4f6` / `#374151` | `#1f2937` / `#d1d5db` |
| `IN_PROGRESS` | `statusInProgress` | `statusInProgressText` | `#dbeafe` / `#1d4ed8` | `#1e3a8a` / `#93c5fd` |
| `REVIEW` | `statusReview` | `statusReviewText` | `#fef3c7` / `#b45309` | `#78350f` / `#fcd34d` |
| `DONE` | `statusDone` | `statusDoneText` | `#dcfce7` / `#15803d` | `#14532d` / `#86efac` |

### Priority (`IssuePriority`)

| Backend value | Background token | Text token | Light background / text | Dark background / text |
| --- | --- | --- | --- | --- |
| `LOW` | `priorityLow` | `priorityLowText` | `#f3f4f6` / `#374151` | `#1f2937` / `#d1d5db` |
| `MEDIUM` | `priorityMedium` | `priorityMediumText` | `#dbeafe` / `#1d4ed8` | `#1e3a8a` / `#93c5fd` |
| `HIGH` | `priorityHigh` | `priorityHighText` | `#ffedd5` / `#c2410c` | `#7c2d12` / `#fdba74` |
| `URGENT` | `priorityUrgent` | `priorityUrgentText` | `#fee2e2` / `#b91c1c` | `#7f1d1d` / `#fca5a5` |

### Usage rules

- **Mapping lives in features.** Turning a backend value (for example `IN_PROGRESS`) into these
  tokens is done in feature code. `theme.ts` does not import API types (`ARCHITECTURE.md` §14).
- **Never colour alone.** Status and priority always appear as a **text label** on the tinted
  background, as on the web (`ENGINEERING_STANDARDS.md` §14).
- **Always use the pair.** A background token is always used with its matching text token.

---

## 3. Preserved as-is

| Area | Decision |
| --- | --- |
| Base colours | The existing `text`, `background`, `backgroundElement`, `backgroundSelected`, and `textSecondary` values are **unchanged**. The base theme is not restyled to the web's values at this stage. |
| Light/dark behaviour | **System-driven**, unchanged: `src/hooks/use-color-scheme.ts` → `src/hooks/use-theme.ts`, with `app.json` `"userInterfaceStyle": "automatic"`. The web app's manual toggle is not ported. |
| Typography | The existing `Fonts` (system fonts on iOS) and `ThemedText` types are unchanged. The web's 12 px badge text is not ported; mobile badges use the existing `small` and `smallBold` types. |
| Spacing | The existing `Spacing` scale is unchanged. The web's small control paddings are not ported, because mobile controls must meet the 44 pt touch target (`ENGINEERING_STANDARDS.md` §14). |

---

## 4. Deferred decisions

| Item | Status |
| --- | --- |
| `Radius` constant (web `rounded-md` 6, `rounded-lg` 8, `rounded-full`) | **Deferred** until an implementation step actually needs it. |
| `linkPrimary` in `src/components/themed-text.tsx` (hard-coded `#3c87f7`, outside the theme) | **Deferred.** The component is unchanged. |

### Not part of this accepted mapping

Other tokens considered during the mapping are **not adopted**: `border`, `borderInput`, `surface`,
`primary`, `onPrimary`, `danger`, `onDanger`. Adding any of them is a separate, explicit decision.
