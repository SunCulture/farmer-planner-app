**Migrations — Local development**

This document describes how to generate and apply schema migrations using `drizzle-kit` for local development.

Prerequisites

- Install the CLI and ORM developer packages (already added as devDependencies):

```bash
pnpm add -D drizzle-kit drizzle-orm
```

Generate a new migration

```bash
pnpm run migrate:generate -- --name add_some_table
```

- This uses the `drizzle.config.ts` in the repository and the schema at `drizzle/schema.ts`.
- The generated SQL/TS migration will be placed under `drizzle/migrations`.

Apply (push) migrations

```bash
pnpm run migrate:push
```

- `drizzle-kit push` will apply migrations to the configured development database (see `drizzle.config.ts`).
- For mobile device databases (Expo `expo-sqlite`) you will typically rely on idempotent `CREATE TABLE IF NOT EXISTS` statements in app bootstrap or apply the generated SQL against the device DB with a custom script.

Notes

- The repo includes a simple `initDatabase()` helper at `src/shared/infrastructure/database` that performs essential `CREATE TABLE IF NOT EXISTS` statements on startup. This pattern keeps app startup resilient while migration tooling evolves.
- Keep migrations committed under `drizzle/migrations` and use the CLI to generate them rather than hand-editing when possible.
