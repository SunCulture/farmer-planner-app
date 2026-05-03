import type Database from "@/shared/contracts/database"

export async function runMigrationsIfAvailable(db: Database): Promise<void> {
  try {
    // try to require fs; this will fail on native runtime, but works in Node/dev
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs")
    // path is relative to project root
    const migrationsDir = `${process.cwd()}/drizzle/migrations`
    if (!fs.existsSync(migrationsDir)) return

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f: string) => f.endsWith(".sql"))
      .sort()

    for (const file of files) {
      const full = `${migrationsDir}/${file}`
      const sql = fs.readFileSync(full, "utf8")
      // naive split by semicolon; execute each statement
      const statements = sql
        .split(";")
        .map((s: string) => s.trim())
        .filter(Boolean)

      // run statements sequentially in a transaction
      await new Promise<void>((resolve, reject) => {
        db.transaction(
          (tx) => {
            for (const s of statements) {
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              tx.executeSql(
                s + ";",
                [],
                () => {},
                () => {},
              )
            }
          },
          (err: any) => reject(err),
          () => resolve(),
        )
      })
    }
  } catch {
    // fs not available or migration application failed: ignore for now
  }
}

export default runMigrationsIfAvailable
