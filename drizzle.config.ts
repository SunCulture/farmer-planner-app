/* eslint-disable */
import { defineConfig } from "drizzle-kit"

// Drizzle configuration for local development and migration generation.
// Use `pnpm add -D drizzle-kit drizzle-orm @drizzle-orm/sqlite-core` and then
// run the drizzle-kit CLI to generate or apply migrations.
export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  driver: "sqlite",
  dbCredentials: {
    url: "file:./drizzle/dev.db",
  },
})
