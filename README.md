# Tujiweze

**Tujiweze** ("Let us be capable") is a mobile-first farming planner that helps smallholder farmers in East Africa make better decisions, track their work, and grow more profitably — one season at a time.

The app is built on Ignite Red, Expo Router, and Expo SDK 55. Product direction, architecture, and decision records live in this repository and should drive implementation over upstream Ignite boilerplate defaults.

## What This Project Is

Tujiweze is being built as:

- a React Native app with Ignite Red as the UI and styling foundation
- a local-first mobile experience designed for intermittent connectivity
- a modular, domain-oriented codebase with explicit boundaries
- a farming productivity tool that prioritises practical guidance, seasonal planning, and on-farm journaling over complex agri-data platforms

## Core Product Idea

Farmers are most profitable when they plan ahead, act at the right time, and reflect on what worked. Tujiweze supports that loop with three core areas:

- **Plan** — seasonal farming plans: what to grow, when to plant, input budgets, and expected yields
- **Journal** — lightweight daily or weekly farm logs: activities done, observations, weather, spend
- **Home** — a dashboard that surfaces what matters right now: upcoming tasks, active plans, recent journal entries

The system is optimised for:

- low-friction daily use on affordable Android devices
- offline resilience and local data durability
- actionable, context-aware prompts (what to do this week on your farm)
- a farmer-first UX: simple language, visual cues, Swahili-friendly design

## Current Technical Direction

The implementation uses:

- Ignite Red components and styling conventions for presentation
- Expo Router for navigation (route files in `src/app` only)
- TanStack Query for server state
- SQLite plus a custom migration runner for durable local data
- Constructor-injected use cases behind a composition root (`src/bootstrap/container.ts`)
- Jest for unit and integration testing
- Maestro for end-to-end critical user journeys

Main ADRs currently in force:

- [ADR-001: Adopt TanStack Query for Server State](docs/adr/001-adopt-tanstack-query.md)
- [ADR-002: Use SQLite for Durable Local Data](docs/adr/002-use-sqlite-and-drizzle.md)
- [ADR-003: Define a Local-First Sync Engine Contract](docs/adr/003-sync-engine-contract.md)
- [ADR-004: Use Composition-Root Dependency Injection and Thin App Bootstrap](docs/adr/004-dependency-injection-and-bootstrap.md)

## Getting Started

### Prerequisites

- Node.js 20 or newer
- pnpm
- Expo and EAS-compatible local mobile tooling
- Android Studio and/or Xcode for native builds

### Install

```bash
pnpm install
```

### Start the App

```bash
pnpm run start
```

Platform shortcuts:

```bash
pnpm run android
pnpm run ios
pnpm run web
```

If you need a native dev-client build first:

```bash
pnpm run build:android:device
pnpm run build:ios:device
```

Other available commands are in [package.json](package.json).

## How We Are Building It

### Architecture Rules

- Feature code lives in `src/modules/<feature>` with `domain`, `application`, `infrastructure`, and `presentation` layers
- Expo Router files in `src/app` are thin route bindings only — no business logic
- Presentation must not import concrete infrastructure; resolve via `container`
- Domain layer: pure TypeScript, no React/Expo/SDK imports
- Cross-feature imports go through each module's `index.ts` public entry point

### Styling and UI

- Use Ignite Red built-in components first (`Screen`, `Text`, `Button`, `TextField`, `Header`, `Card`)
- Follow Ignite styling practices: colocated themed styles, `$`-prefixed style variables, preset-based reuse
- Design tokens live in `src/theme/tapp-tokens.ts` — never hardcode hex values or pixel sizes in screens
- Avoid introducing a second UI framework unless a specific gap forces it

### Data and Sync

- The app is local-first by design — works fully offline
- Durable business data lives in SQLite via a custom sequential migration runner
- Sync is modelled around an outbox, checkpoints, and explicit conflict policies
- Background work is opportunistic and must respect mobile platform constraints

### Testing

- Write tests in the same pull request as the feature
- Colocate feature tests with the code they verify
- Use Jest for unit and integration coverage
- Use Maestro for critical end-to-end journeys
- Treat missing tests as missing deliverables

```bash
pnpm run compile
pnpm run lint:check
pnpm run test
pnpm run test:watch
pnpm run test:maestro
pnpm run depcruise
```

## Project Structure

```
src/
  app/                  # Expo Router bindings only — keep thin
    (tabs)/             # Bottom nav: home, plan, journal
    onboarding.tsx
    profile.tsx
  bootstrap/            # App startup, DI container, QueryClient
  modules/
    home/               # Dashboard — upcoming tasks, plan summary, recent logs
    plan/               # Seasonal farm plans (crops, inputs, timeline, budget)
    journal/            # Daily/weekly farm activity logs
    onboarding/         # First-run flow: farmer profile, farm size, crops grown
    profile/            # Farmer profile and settings
  shared/               # Cross-feature contracts, DB init, sync engine
  theme/                # Ignite theme + design tokens
  components/           # Shared Ignite components
docs/                   # Product, architecture, and decision records
```

## Releases and Delivery

- Pull requests run lint, typecheck, tests, and architecture boundary checks
- Merges to `main` produce QA-ready preview artifacts
- Signed builds are produced through EAS Build
- OTA updates are delivered through EAS Update when native compatibility allows
- Conventional commits drive versioning and release notes

## Documentation Map

- Architecture: [docs/architecture.md](docs/architecture.md)
- ADR index: [docs/adr/README.md](docs/adr/README.md)
- Agent rules: [AGENTS.md](AGENTS.md)
- Code quality guide: [docs/CODE_QUALITY.md](docs/CODE_QUALITY.md)

## Notes for Contributors

- Prefer minimal, architecture-aligned changes over broad refactors
- Keep feature code inside its intended module boundary
- If a change affects architecture, sync behaviour, storage boundaries, or startup wiring, update the relevant docs or ADRs in the same PR
- The goal is a tool that makes a real difference to a farmer's income — keep that outcome in mind when making product and technical decisions
