# AGENTS.md — Tujiweze Engineering Agent Instructions

> This file guides GitHub Copilot, Claude Code, and any AI agent working in this codebase.
> Read this before making changes. Use it together with the architecture, ADRs, and code quality docs.

---

## Project Identity

**Tujiweze** ("Let us be capable") is a mobile-first farming planner for smallholder farmers in East Africa, built on Ignite Red, Expo Router, and Expo SDK 55. It helps farmers plan ahead, act at the right time, and reflect on what worked, through three core areas:

- **Plan** — seasonal farming plans: what to grow, when to plant, AI-generated day-by-day activities
- **Journal** — activity completion logs: photos, notes, and history tied to plan activities
- **Home** — a dashboard surfacing upcoming tasks, active plans, and recent journal entries

The app is a **local-first mobile product** with strong architectural boundaries, explicit synchronization rules, and a presentation layer that follows Ignite Red components and styling conventions.

Core references:

- Architecture: [docs/architecture.md](docs/architecture.md)
- ADR index: [docs/adr/README.md](docs/adr/README.md)
- Code quality guide: [docs/CODE_QUALITY.md](docs/CODE_QUALITY.md)
- Migrations: [docs/migrations.md](docs/migrations.md)

---

## Tech Stack

| Technology                             | Role                                  | Status |
| --------------------------------------- | -------------------------------------- | ------ |
| React Native 0.83, React 19             | Mobile runtime                         | Active |
| Expo SDK 55                             | App platform                           | Active |
| Expo Router                             | Navigation                             | Active |
| Ignite Red                              | UI components and styling conventions  | Active |
| TypeScript 5.9                          | Language                               | Active |
| TanStack Query                          | Server state                           | Active |
| SQLite + custom migration runner        | Durable local data                     | Active |
| Apisauce                                | HTTP transport (wrapped in infra adapters) | Active |
| i18next / react-i18next                 | Localization                           | Active |
| MMKV                                    | Lightweight key-value storage (preferences only) | Active |
| Jest + `@testing-library/react-native`  | Unit and component testing             | Active |
| Maestro                                 | End-to-end testing                     | Active |
| dependency-cruiser                      | Boundary enforcement                   | Active |
| Zod + react-hook-form                   | Validation and forms                   | Approved direction, not yet fully wired |
| expo-secure-store                       | Secrets storage                        | Approved direction, not yet fully wired |

Critical note:

1. Do not introduce a different server-state library.
2. Do not introduce a second design system or UI framework.
3. Do not store durable relational business data in MMKV.
4. Do not put business-critical correctness behind background execution windows.

---

## Developer Workflows

Package manager is **pnpm**.

| Task                    | Command                    |
| ----------------------- | --------------------------- |
| Start dev client        | `pnpm run start`            |
| Run Android              | `pnpm run android`          |
| Run iOS                  | `pnpm run ios`              |
| Run web                  | `pnpm run web`              |
| Typecheck                | `pnpm run compile`          |
| Lint and fix              | `pnpm run lint`              |
| Lint check                | `pnpm run lint:check`       |
| Boundary checks           | `pnpm run depcruise`        |
| Unit tests                | `pnpm run test`             |
| Watch tests                | `pnpm run test:watch`       |
| Maestro flows              | `pnpm run test:maestro`     |
| Align Expo dependencies    | `pnpm run align-deps`       |
| Create a migration          | `pnpm migrate:make <name>`  |

Use local EAS build scripts from `package.json` for simulator, device, preview, and production builds.

---

## Directory Conventions

```text
src/
  app/             # Expo Router route bindings only — keep thin
  bootstrap/       # Startup orchestration, DI container, QueryClient, migration runner
  modules/         # Feature modules: home, plan, journal, onboarding, profile
  shared/          # Stable shared abstractions, DB contracts, sync engine
```

Module structure:

```text
src/modules/{feature}/
  domain/
  application/
  infrastructure/
  presentation/
  index.ts
```

Hard rules:

1. If code belongs to one feature, it belongs under `src/modules/{feature}`.
2. Route files under `src/app` stay thin and should only bind route concerns to feature entry points.
3. Presentation code must not import infrastructure implementations directly.
4. Cross-feature imports must go through public entry points (`index.ts`), never deep imports into another module.
5. Shared code does not depend on feature modules.
6. Secrets belong in secure storage or backend-managed flows, never MMKV.
7. Durable schema changes require a migration file via `pnpm migrate:make` — see [docs/migrations.md](docs/migrations.md).

---

## The Four-Layer Mobile Architecture

```text
Presentation     -> screens, hooks for UI binding, components
Application      -> use cases, commands, queries, orchestration
Domain           -> entities, value objects, policies, repository contracts
Infrastructure   -> API adapters, database repos, notification adapters, sync adapters
```

Dependency rule: layers depend inward only.

- `presentation` may depend on `application` and shared UI utilities
- `application` may depend on `domain`
- `infrastructure` implements `domain` and `application` contracts
- `domain` depends on no React Native, Expo, storage SDK, or transport details

---

## Layer Contracts

### Presentation Layer

✅ MUST:

- use Ignite Red components first: `Screen`, `Text`, `Button`, `TextField`, `Header`, `Card`, `EmptyState`, `Icon`
- keep route files thin
- use local state only for local interaction concerns
- prefer `FlatList` or `SectionList` for unbounded mobile lists
- keep styles colocated and themed using Ignite conventions

❌ NEVER:

- import raw API clients or database adapters directly
- place business rules in screens or JSX branches when they belong in domain or application code
- use `ScrollView` for large, changing datasets when virtualization is needed
- block startup with unrelated initialization logic in route files

### Application Layer

✅ MUST:

- expose use cases and orchestration for user-facing actions
- receive dependencies through constructors or factories
- coordinate local writes, outbox creation, and sync triggers where appropriate
- remain free of JSX and UI rendering concerns

❌ NEVER:

- construct infrastructure implementations inside use cases
- import Expo or React Native SDK modules directly unless the abstraction is explicitly application-owned
- hide side effects in utility functions with unclear ownership

### Domain Layer

✅ MUST:

- remain pure TypeScript
- model business concepts such as farm plans, activities, journal entries, and farmer profiles
- enforce invariants at creation boundaries
- be straightforward to unit test without React Native or Expo

❌ NEVER:

- import React, React Native, Expo, database clients, or HTTP clients
- access storage, network, or device APIs

### Infrastructure Layer

✅ MUST:

- contain transport, storage, database, notification, and background task adapters
- implement repository or port contracts defined elsewhere
- map raw external data into validated internal shapes
- isolate platform-specific concerns behind stable interfaces

❌ NEVER:

- leak implementation details into presentation files
- define core business rules that belong in domain or application

---

## React Native and Expo Rules

1. Use Ignite styling practices by default: themed style functions, `$` naming, preset-based reuse, and no `StyleSheet.create()` unless there is a clear measured need.
2. Prefer the app's wrapper components over raw React Native `Text`, `Button`, and `TextInput`.
3. Safe area handling should go through the existing `Screen` component or `react-native-safe-area-context`, not ad hoc layout padding.
4. Keep `src/app/_layout.tsx` thin. Startup orchestration belongs in bootstrap modules, per ADR-004.
5. Background tasks are opportunistic. Do not design correctness around exact schedules on iOS or Android.
6. Use Expo-aligned dependency updates. Do not upgrade React Native independently of Expo.
7. For icons and splash assets, use Ignite generators instead of hand-editing platform assets.

---

## State, Data, and Storage Rules

1. Treat server state, durable local data, device preferences, and UI state as separate categories.
2. MMKV is for preferences and lightweight device state, not relational business data.
3. Persisted business data must go through repositories and migrations (SQLite with a custom migration runner is active).
4. All sync-capable writes should be designed so they can evolve into local-first plus outbox behavior.
5. Parse and validate external data at boundaries. Do not spread raw backend payload shapes through the app.

---

## Testing Rules

1. Tests ship with the feature, not after the feature.
2. Use Jest for unit and integration tests.
3. Use `@testing-library/react-native` for component and screen behavior.
4. Use Maestro for core end-to-end user journeys.
5. Co-locate tests with the feature code when possible.
6. Prioritize tests for domain logic, repositories, use cases, and critical screen flows.

Definition of done for new feature work:

- feature code lives in the correct layer
- boundaries are respected
- tests are added in the same pull request
- documentation is updated if the work changes architecture, sync, storage, or startup behavior

---

## Mobile Performance Rules

1. Optimize for perceived responsiveness on mid-range devices — many target users are on affordable Android hardware with intermittent connectivity.
2. Memoize heavy list rows and expensive derived values when profiling shows churn.
3. Prefer virtualization over rendering long lists eagerly.
4. Avoid large anonymous inline objects and handlers in hot rendering paths when they trigger unnecessary re-renders.
5. Keep development-only tooling such as Reactotron out of production behavior.

---

## Security Baseline

Before shipping any feature, verify:

1. No secrets or tokens are stored in MMKV.
2. No sensitive data is logged.
3. Persisted data shapes are versioned when they are durable.
4. Farmer-level data-access boundaries are respected.

---

## Anti-Patterns To Avoid

- business logic in route files or JSX-heavy components
- screens importing API clients directly
- storing structured app data in MMKV blobs
- secrets in MMKV
- cross-feature deep imports
- startup logic scattered across screens and utilities
- background logic that assumes iOS or Android will run on an exact schedule
- generic utility dumping grounds for feature-specific code
- adding new features without tests

---

## Source Of Truth

When guidance conflicts:

1. ADRs override generic preferences
2. architecture doc defines the target structure
3. this file defines implementation and code quality rules for agents

Keep this file aligned with the repo as the architecture evolves.
