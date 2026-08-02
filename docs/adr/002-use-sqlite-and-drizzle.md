# ADR-002: Use SQLite for Durable Local Data

## Status

Superseded (2026-08-01) — the Drizzle ORM portion of this decision was never implemented. SQLite remains the durable on-device store, but the schema/query/migration layer is a custom raw-SQL runner, not Drizzle. See "Implementation Note" and "Update" below.

## Context

The application is expected to support offline access, sync checkpoints, and durable device-side records. MMKV is already present and works well for fast key-value storage, but it is not a good fit for relational data, queryable history, migrations, or conflict-aware synchronization.

The architecture needs a local store that supports:

- structured tables and explicit schemas
- forward migrations
- indexed queries and joins
- durable offline reads
- an outbox and sync metadata
- repository-backed abstractions instead of ad hoc blobs

## Decision (original, partially superseded)

Use SQLite as the durable on-device database and Drizzle ORM as the schema and query layer.

Scope:

- SQLite stores business data that must survive restarts and support offline-first behavior
- Drizzle defines schema, migrations, and typed query access
- MMKV remains in use only for lightweight preferences and non-secret key-value state
- Secure Store is used for secrets

## Consequences

Positive:

- durable structured storage that matches the local-first architecture
- migration support for evolving features
- explicit foundation for sync metadata and outbox processing

Tradeoffs:

- adds database complexity to the mobile app
- requires migration discipline during feature development
- increases testing scope because repository and migration paths need coverage

Operational implications:

- create a shared database bootstrap module under `src/shared/infrastructure/database`
- commit migrations to source control
- block app startup on failed required migrations
- add integration tests for repositories against a test database

## Implementation Note (2026-05-24)

The migration runner is a custom sequential runner, not `drizzle-kit push` or `drizzle-kit generate`. Each migration is a TypeScript file with `up()` and `down()` functions tracked by a `_migrations` table. `drizzle-kit` is not used at runtime. See [docs/migrations.md](../migrations.md) for the full workflow.

## Update (2026-08-01)

Drizzle was never wired into the app. `drizzle-orm`/`drizzle-kit` were listed as devDependencies and a `drizzle/schema.ts` + `drizzle.config.ts` scaffold existed, but nothing in `src/` imported them, and the scaffold's schema (`categories`, `routines`, `expense_events`) described an earlier, unrelated product rather than Tujiweze's actual domain. Both the dependencies and the scaffold have been removed.

The SQLite half of this decision stands: durable local data is a real, active requirement, and the custom migration runner in `src/shared/infrastructure/database` (raw SQL, no ORM) is the implementation of record. Current tables: `outbox`, `sync_checkpoints`. See [docs/migrations.md](../migrations.md) for the live workflow.

If typed schema/query access becomes worth the added dependency later, that should be a new ADR rather than reviving this one, since the tradeoffs (an ORM on top of expo-sqlite vs. the current raw-SQL repositories) deserve fresh evaluation against whatever the schema looks like at that point.

## Alternatives Considered

### MMKV only

Rejected because it is not sufficient for relational querying, versioned schema evolution, or robust offline synchronization.

### Raw SQLite without ORM

Originally rejected in favor of Drizzle, on the belief that typed schema definitions and a centralized query layer were worth the dependency. This is what was actually built — see "Update" above.

### WatermelonDB or Realm

Rejected because SQLite is a smaller and more explicit fit for the current architecture, with fewer additional abstractions than a heavier mobile database framework.
