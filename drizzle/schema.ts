/* eslint-disable */
// Drizzle schema scaffold for the initial local-first entities.
// Install `drizzle-orm` and `@drizzle-orm/sqlite-core` to use this schema.
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
})

export const routines = sqliteTable("routines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
})

export const expense_events = sqliteTable("expense_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  amount: integer("amount").notNull(),
  category_id: integer("category_id"),
  created_at: integer("created_at").notNull(),
})

export default { categories, routines, expense_events }
