# CLAUDE.md — Tapp Project Context

> This file is read automatically by Claude Code at the start of every session.
> It is the fast-path to project context — read it before touching any file.

---

## What is this project

**Tapp** is a React Native family budgeting app (Expo SDK 55, Expo Router, Ignite Red, TypeScript 5.9).
Core loop: one tap at the point of spend → local persist → review and correct later.
Target markets: East Africa, Southeast Asia (manual tracking beats bank integrations).

Key docs (read before making architectural decisions):

- Architecture decisions: [docs/architecture.md](docs/architecture.md)
- ADR index: [docs/adr/README.md](docs/adr/README.md)
- Execution order / task list: [docs/start-here.md](docs/start-here.md)
- Code quality rules: [docs/CODE_QUALITY.md](docs/CODE_QUALITY.md)
- Agent rules: [AGENTS.md](AGENTS.md)

---

## Tech stack (quick reference)

| Concern | Tool |
| --- | --- |
| Runtime | React Native 0.83 + Expo SDK 55 |
| Navigation | Expo Router (route files in `src/app` only) |
| UI components | Ignite Red (`Screen`, `Text`, `Button`, `TextField`, `Header`, `Card`) |
| Styling | Ignite themed style functions, `$`-prefixed style vars, no `StyleSheet.create` |
| Local data | expo-sqlite + Drizzle (migrations in `drizzle/`) |
| Server state | TanStack Query (client in `src/bootstrap/query-client.ts`) |
| DI / bootstrap | `src/bootstrap/container.ts` — register and resolve infra via `container` |
| Fonts | SpaceGrotesk (body), SpaceMono (mono amounts) — loaded in `AppProviders` |
| Icons | Phosphor Icons via `@expo/vector-icons` or bundled icon map |
| State | TanStack Query for server state; `useState` / `useReducer` for local UI state |

---

## Design system (Tapp — from design export)

Design tokens live in **`src/theme/tapp-tokens.ts`**. Always import from there — never hardcode raw hex or pixel values in screens.

### Core tokens

```
paper:       warm cream (#FAF8F4 approx)  — page background
card:        white                         — elevated cards
ink:         warm dark                     — primary text
ink-2/3/4:  secondary/tertiary/disabled   — text hierarchy
hairline:   warm light grey               — dividers
coral-500:  oklch(0.66 0.155 30)          — THE brand accent (one per screen)
coral-600:  pressed state
heat-good:  green  | heat-warn: amber | heat-over: coral-red  — budget bars
cat-clay/mango/fern/lake/orchid/stone     — 6 category colors
```

### Typography rules

- **Body/UI**: SpaceGrotesk (closest free alternative to AkkuratPro in the Expo ecosystem)
- **Mono amounts**: SpaceMono — EVERY number, percentage, amount must use mono font
- **Display (day names, family names)**: SpaceGrotesk Bold at large sizes
- Use `src/theme/tapp-tokens.ts` token constants, never raw font strings in screens

### Layout rules

- Edge gutter: 20px on phones
- Bottom nav: 3 tabs (Tap · Review · Family), safe-area aware, coral active state
- Tap button: 200×200 circular, coral radial gradient, coral glow shadow
- Min tap target: 44×44 on every interactive element

---

## Directory structure

```
src/
  app/                  # Expo Router bindings only — keep thin
    (tabs)/             # Bottom nav group: tap, review, family
    expenses/           # Route wrappers for expense screens
  bootstrap/            # App startup, DI container, QueryClient
  modules/
    expenses/
      domain/           # Entities, value objects, repository interfaces
      application/      # Use cases (create-expense, predict-category, …)
      infrastructure/   # SQLite repos, sync engine
      presentation/     # Screens and hooks
  shared/               # Cross-feature contracts, DB init, sync engine
  theme/                # Ignite theme + Tapp design tokens
  components/           # Ignite shared components
modules/
  tapp-widget/          # Native home-screen widget (Android + iOS)
```

### Hard rules

1. Route files in `src/app` are thin bindings only — no business logic.
2. Presentation must not import infra implementations; resolve via `container`.
3. Domain layer: pure TypeScript, no React/Expo/SDK imports.
4. Cross-feature imports go through `index.ts` public entry points.
5. All amounts rendered in **SpaceMono** (or equivalent mono font).
6. One coral accent per screen — do not overuse.

---

## Git workflow

- `main` is the stable branch
- Feature work lives on `feat/<topic>` branches
- Each branch ships as a PR; merge before starting the next
- Commit messages: `type(scope): description` (conventional commits)

---

## Active implementation phase

See [docs/start-here.md](docs/start-here.md) for the full task list.
Current focus: **design implementation** — translating the Tapp design system into the React Native screens.

Branches planned (in order):

1. `feat/design-tokens` — Tapp color tokens + typography in theme
2. `feat/bottom-nav` — proper bottom navigation (Tap · Review · Family)
3. `feat/tap-screen` — coral tap button, hero amount, predicted pill
4. `feat/review-screen` — daily review with event cards, shadow rows
5. `feat/categories-screen` — categories with color picker
6. `feat/family-screen` — family view (member rows, category heat bars)
