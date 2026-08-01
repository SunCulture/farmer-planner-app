# CLAUDE.md — Tujiweze Mobile

> This file is read automatically by Claude Code at the start of every session.
> It is the fast-path to project context — read it before touching any file.

---

## What is this project

**Tujiweze** ("Let us be capable") is a mobile-first farming planner for smallholder farmers in East Africa (React Native, Expo SDK 55, Expo Router, Ignite Red, TypeScript 5.9). Three core areas: **Plan** (AI-generated seasonal farming plans), **Journal** (daily/weekly activity logs with photos), **Home** (dashboard of upcoming tasks and active plans). Local-first, offline-resilient, optimised for affordable Android devices.

Key docs (read before making architectural decisions):

- Architecture: [docs/architecture.md](docs/architecture.md)
- ADR index: [docs/adr/README.md](docs/adr/README.md)
- Code quality rules: [docs/CODE_QUALITY.md](docs/CODE_QUALITY.md)
- Migrations: [docs/migrations.md](docs/migrations.md)
- Agent rules: [AGENTS.md](AGENTS.md)

---

## Tech stack (quick reference)

| Concern | Tool |
| --- | --- |
| Runtime | React Native 0.83 + Expo SDK 55, React 19 |
| Navigation | Expo Router (route files in `src/app` only) |
| UI components | Ignite Red (`Screen`, `Text`, `Button`, `TextField`, `Header`, `Card`) |
| Styling | Ignite themed style functions, `$`-prefixed style vars, no `StyleSheet.create` |
| Local data | expo-sqlite + custom migration runner, raw SQL (no ORM — see ADR-002) (`src/bootstrap/migration-runner.ts`, migrations in `src/shared/infrastructure/database/migrations/`) |
| Server state | TanStack Query (client in `src/bootstrap/query-client.ts`) |
| DI / bootstrap | `src/bootstrap/container.ts` — register and resolve infra via `container` |
| Transport | Apisauce, wrapped in infrastructure adapters — never raw `fetch` in screens/hooks |
| Preferences | MMKV (device preferences only — never durable business data or secrets) |
| Secrets | expo-secure-store (not yet fully wired — do not fall back to MMKV) |
| i18n | i18next / react-i18next (`src/i18n`) |
| Testing | Jest + `@testing-library/react-native`, Maestro for E2E |
| Boundaries | dependency-cruiser (`pnpm run depcruise`) |

---

## Developer workflows

Package manager is **pnpm**.

| Task | Command |
| --- | --- |
| Start dev client | `pnpm run start` |
| Run Android | `pnpm run android` |
| Run iOS | `pnpm run ios` |
| Run web | `pnpm run web` |
| Typecheck | `pnpm run compile` |
| Lint and fix | `pnpm run lint` |
| Lint check | `pnpm run lint:check` |
| Boundary checks | `pnpm run depcruise` |
| Unit tests | `pnpm run test` |
| Single test file | `pnpm jest path/to/file.test.ts` |
| Watch tests | `pnpm run test:watch` |
| Maestro flows | `pnpm run test:maestro` |
| Align Expo dependencies | `pnpm run align-deps` |
| Create a migration | `pnpm migrate:make <name>` |

Local EAS build scripts (`build:android:*`, `build:ios:*`) are in `package.json` for simulator/device/preview/production builds.

---

## Design system

Design tokens live in **`src/theme/tujiweze-tokens.ts`** — always import from here, never hardcode raw hex/pixel values in screens.

### Core tokens

```
paper / paper2 / paperCool: warm cream / cool near-white — page backgrounds
card:        white                          — elevated cards
ink/ink2/3/4: warm dark → disabled          — text hierarchy
hairline:    warm light grey                — dividers
forest500:   #2A5C2A                        — THE brand accent (Forest Green), one per screen max
forest600:   pressed state
statusGood/Warn/Bad: green/amber/red        — status + activity states
```

### Layout rules

- Edge gutter: 20px on phones
- Bottom nav: 3 tabs — Home · Plan · Journal (see `src/app/(tabs)/`)
- Min tap target: 44×44 on every interactive element

---

## Directory structure

```
src/
  app/                  # Expo Router bindings only — keep thin
    (tabs)/             # Bottom nav group: home (index), plan, journal
    onboarding.tsx
    profile.tsx
  bootstrap/            # App startup, DI container, QueryClient, migration runner
  modules/
    home/               # Dashboard — upcoming tasks, plan summary, recent logs
    plan/                # Seasonal plans: generate/enroll plans, day plans, activity cards, plan-audit chat
    journal/             # Daily/weekly activity logs, completions, photo uploads
    onboarding/          # First-run flow: farmer profile, farm size, crops/livestock, goals
    profile/             # Farmer profile and settings
    {feature}/
      domain/            # Entities, value objects, repository contracts — pure TypeScript
      application/       # Use cases / hooks (create/generate/patch/enroll, etc.)
      infrastructure/    # API clients (`*-api.ts`), services, mappers
      presentation/      # Screens (e.g. `HomeScreen.tsx`, `PlanScreen.tsx`, `JournalScreen.tsx`)
      index.ts           # Public entry point — only path other modules may import through
  shared/                # Cross-feature contracts (api/database/sync/telemetry), sync engine
  theme/                 # Ignite theme + design tokens (tujiweze-tokens.ts)
  components/            # Ignite shared components
  services/api/          # Base API client, error/response unwrapping, shared types
  i18n/                  # Translations (en, fr, es, ar, hi, ja, ko)
```

### Hard rules

1. Route files in `src/app` are thin bindings only — no business logic.
2. Presentation must not import infra implementations; resolve via `container`.
3. Domain layer: pure TypeScript, no React/Expo/SDK imports.
4. Cross-feature imports go through module `index.ts` public entry points.
5. Durable business data goes through SQLite + the migration runner — never MMKV. MMKV is preferences only; secrets go through Secure Store, never MMKV.
6. Server state goes through TanStack Query; no bespoke `useEffect` + `fetch` in screens.
7. One brand accent (`forest500`) per screen — do not overuse.

---

## Git workflow

- `main` is the stable branch
- Feature work lives on `feat/<topic>` branches
- Each branch ships as a PR; merge before starting the next
- Commit messages: `type(scope): description` (conventional commits)

---

## Current state

Built: onboarding (farmer profile, farm details, catalog-driven crop/livestock/goal selection), Home dashboard (week strip, plan recommendations), Plan (AI plan generation/enrollment, day-plan view, activity cards, plan-audit chat), Journal (activity completions with photos, timeline, day history), Profile/settings. Backend integration is via `tujiweze-backend`'s `/api/me/*` endpoints (see `tujiweze-backend/README.md` for the contract).

For architecture rationale and target-state details beyond what's implemented, see [docs/architecture.md](docs/architecture.md) and the ADRs in [docs/adr/](docs/adr/) — treat ADRs as authoritative over this file when they conflict.
