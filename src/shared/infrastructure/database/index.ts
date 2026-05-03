/*
  Database bootstrap moved here per ADR-002.
  This file initializes the on-device SQLite database and runs basic migrations.
*/
import * as SQLite from "expo-sqlite"

export function getDatabase() {
  const sqlite: any = SQLite
  if (typeof sqlite.openDatabase === "function") return sqlite.openDatabase("tapp.db")
  if (typeof sqlite.openDatabaseSync === "function") return sqlite.openDatabaseSync("tapp.db")
  throw new Error("expo-sqlite: openDatabase is not available in this runtime")
}

function createInMemoryDb() {
  console.warn("DB: creating in-memory fallback database (dev only)")

  const state: any = {
    categories: [],
    routines: [],
    expense_events: [],
    outbox: [],
    checkpoints: [],
    nextCategoryId: 0,
    nextRoutineId: 0,
    nextExpenseId: 0,
    nextOutboxId: 0,
  }

  function makeRows(items: any[]) {
    return {
      length: items.length,
      item: (i: number) => items[i],
    }
  }

  const tx = {
    executeSql(sql: string, params: any[] = [], success?: Function, error?: Function) {
      try {
        const s = sql.trim()
        // CREATE TABLE
        if (/^CREATE TABLE IF NOT EXISTS/i.test(s)) {
          success && success(tx, { rows: makeRows([]) })
          return
        }

        // Categories: INSERT
        if (/^INSERT\s+INTO\s+categories\s*\(name\)\s*VALUES\s*\(\?\)/i.test(s)) {
          const name = params[0]
          const id = ++state.nextCategoryId
          const row = { id, name }
          state.categories.push(row)
          success && success(tx, { insertId: id, rows: makeRows([]) })
          return
        }

        // Categories: SELECT ALL
        if (/^SELECT\s+id\s*,\s*name\s+FROM\s+categories;?$/i.test(s)) {
          const rows = state.categories.map((c: any) => ({ id: c.id, name: c.name }))
          success && success(tx, { rows: makeRows(rows) })
          return
        }

        // Categories: SELECT BY ID
        if (
          /^SELECT\s+id\s*,\s*name\s+FROM\s+categories\s+WHERE\s+id\s*=\s*\?\s+LIMIT\s+1;?$/i.test(
            s,
          )
        ) {
          const id = params[0]
          const rows = state.categories
            .filter((c: any) => c.id === id)
            .map((c: any) => ({ id: c.id, name: c.name }))
          success && success(tx, { rows: makeRows(rows) })
          return
        }

        // Categories: UPDATE
        if (/^UPDATE\s+categories\s+SET\s+name\s*=\s*\?\s+WHERE\s+id\s*=\s*\?/i.test(s)) {
          const [name, id] = params
          const item = state.categories.find((c: any) => c.id === id)
          if (item) item.name = name
          success && success(tx, { rows: makeRows([]) })
          return
        }

        // Categories: DELETE
        if (/^DELETE\s+FROM\s+categories\s+WHERE\s+id\s*=\s*\?/i.test(s)) {
          const id = params[0]
          state.categories = state.categories.filter((c: any) => c.id !== id)
          success && success(tx, { rows: makeRows([]) })
          return
        }

        // Routines: INSERT
        if (/^INSERT\s+INTO\s+routines\s*\(name\)\s*VALUES\s*\(\?\)/i.test(s)) {
          const name = params[0]
          const id = ++state.nextRoutineId
          const row = { id, name }
          state.routines.push(row)
          success && success(tx, { insertId: id, rows: makeRows([]) })
          return
        }

        // Routines: SELECT ALL
        if (/^SELECT\s+id\s*,\s*name\s+FROM\s+routines;?$/i.test(s)) {
          const rows = state.routines.map((r: any) => ({ id: r.id, name: r.name }))
          success && success(tx, { rows: makeRows(rows) })
          return
        }

        // Expense events: INSERT
        if (
          /^INSERT\s+INTO\s+expense_events\s*\(amount\s*,\s*category_id\s*,\s*created_at\)\s*VALUES\s*\(\?\s*,\s*\?\s*,\s*\?\)/i.test(
            s,
          )
        ) {
          const [amount, categoryId, createdAt] = params
          const id = ++state.nextExpenseId
          const row = { id, amount, category_id: categoryId ?? null, created_at: createdAt }
          state.expense_events.push(row)
          success && success(tx, { insertId: id, rows: makeRows([]) })
          return
        }

        // Expense events: SELECT ALL ORDER BY created_at DESC
        if (
          /^SELECT\s+id\s*,\s*amount\s*,\s*category_id\s*,\s*created_at\s+FROM\s+expense_events\s+ORDER\s+BY\s+created_at\s+DESC;?$/i.test(
            s,
          )
        ) {
          const rows = [...state.expense_events]
            .sort((a: any, b: any) => (b.created_at || 0) - (a.created_at || 0))
            .map((e: any) => ({
              id: e.id,
              amount: e.amount,
              category_id: e.category_id,
              created_at: e.created_at,
            }))
          success && success(tx, { rows: makeRows(rows) })
          return
        }

        // Expense events: SELECT BY ID
        if (
          /^SELECT\s+id\s*,\s*amount\s*,\s*category_id\s*,\s*created_at\s+FROM\s+expense_events\s+WHERE\s+id\s*=\s*\?\s+LIMIT\s+1;?$/i.test(
            s,
          )
        ) {
          const id = params[0]
          const rows = state.expense_events
            .filter((e: any) => e.id === id)
            .map((e: any) => ({
              id: e.id,
              amount: e.amount,
              category_id: e.category_id,
              created_at: e.created_at,
            }))
          success && success(tx, { rows: makeRows(rows) })
          return
        }

        // Expense events: DELETE
        if (/^DELETE\s+FROM\s+expense_events\s+WHERE\s+id\s*=\s*\?/i.test(s)) {
          const id = params[0]
          state.expense_events = state.expense_events.filter((e: any) => e.id !== id)
          success && success(tx, { rows: makeRows([]) })
          return
        }

        // Outbox: INSERT
        if (
          /^INSERT\s+INTO\s+outbox\s*\(payload\s*,\s*created_at\)\s*VALUES\s*\(\?\s*,\s*\?\)/i.test(
            s,
          )
        ) {
          const [payload, createdAt] = params
          const id = ++state.nextOutboxId
          state.outbox.push({ id, payload, created_at: createdAt })
          success && success(tx, { insertId: id, rows: makeRows([]) })
          return
        }

        // Outbox: SELECT
        if (
          /^SELECT\s+id\s*,\s*payload\s+FROM\s+outbox\s+ORDER\s+BY\s+created_at\s+ASC;?$/i.test(s)
        ) {
          const rows = state.outbox.map((o: any) => ({ id: o.id, payload: o.payload }))
          success && success(tx, { rows: makeRows(rows) })
          return
        }

        // Outbox: DELETE
        if (/^DELETE\s+FROM\s+outbox\s+WHERE\s+id\s*=\s*\?/i.test(s)) {
          const id = params[0]
          state.outbox = state.outbox.filter((o: any) => o.id !== id)
          success && success(tx, { rows: makeRows([]) })
          return
        }

        // Fallback: unrecognized SQL
        console.warn("DB: fakeDB unrecognized SQL:", sql)
        success && success(tx, { rows: makeRows([]) })
      } catch (err) {
        console.error("DB: fake executeSql error", err)
        if (typeof error === "function") error(err)
      }
    },
  }

  return {
    transaction(fn: Function, error?: Function, success?: Function) {
      try {
        fn(tx)
        if (typeof success === "function") setTimeout(success, 0)
      } catch (e) {
        if (typeof error === "function") error(e)
      }
    },
    // expose some keys to mimic native object shape
    sql: undefined,
    databasePath: ":memory:",
    options: {},
    nativeDatabase: {},
  }
}

export async function initDatabase() {
  console.debug("DB: initDatabase() opening database")
  let db: any = getDatabase()

  try {
    // provide helpful diagnostics if the native database binding is not available
    console.debug("DB: instance type:", typeof db)
    // Some native proxy objects are not enumerable; attempt to show what we can
    try {
      // Log whether transaction/exec/run exist
      console.debug("DB: transaction =>", typeof db?.transaction)
      console.debug("DB: exec =>", typeof db?.exec)
      console.debug("DB: run =>", typeof db?.run)
      // If db is an object, log its keys
      if (db && typeof db === "object") console.debug("DB: keys =>", Object.keys(db))

      // Log typeof db.sql if present
      try {
        console.debug("DB: sql =>", typeof db?.sql)
      } catch (e) {
        console.debug("DB: error while introspecting db.sql", e)
      }

      // If nativeDatabase is present, log its type and keys
      if (db?.nativeDatabase) {
        try {
          console.debug("DB: nativeDatabase type =>", typeof db.nativeDatabase)
          try {
            console.debug(
              "DB: nativeDatabase keys =>",
              Object.keys(db.nativeDatabase || {}).slice(0, 50),
            )
          } catch (e) {
            console.debug("DB: error while introspecting nativeDatabase keys", e)
          }
        } catch (e) {
          console.debug("DB: error while introspecting nativeDatabase", e)
        }
      }
    } catch (e) {
      console.debug("DB: error while introspecting db", e)
    }

    if (!db || typeof db.transaction !== "function") {
      // When running in development without the native module available we provide an in-memory fallback
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.warn("DB: native transaction API missing — using in-memory fallback (dev only)")
        db = createInMemoryDb()
      } else {
        console.error("DB: invalid database instance - transaction is not a function")
        throw new Error(
          "DB: transaction is not a function. The native `expo-sqlite` binding may be missing or incompatible. Try rebuilding the dev-client or running on a device/emulator with the native modules installed.",
        )
      }
    }
  } catch (err: any) {
    // rethrow so the bootstrap sees the failure (we already log higher up)
    throw err
  }

  const statements = [
    `CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS routines (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS expense_events (id INTEGER PRIMARY KEY AUTOINCREMENT, amount INTEGER NOT NULL, category_id INTEGER, created_at INTEGER NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL, created_at INTEGER NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS sync_checkpoints (id INTEGER PRIMARY KEY AUTOINCREMENT, last_synced_at INTEGER);`,
  ]

  await new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx: any) => {
        for (const s of statements) {
          tx.executeSql(s, [])
        }
      },
      (error: any) => {
        console.error("DB: transaction error", error)
        reject(error)
      },
      () => {
        console.debug("DB: transaction success")
        resolve()
      },
    )
  })

  return db
}
