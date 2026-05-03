import type SyncEngine from "@/shared/contracts/sync"

export class SqliteSyncEngine implements SyncEngine {
  private db: any

  constructor(db?: any) {
    this.db = db
    if (!this.db) throw new Error("Database instance required for SqliteSyncEngine")
  }

  async enqueue(payload: unknown): Promise<void> {
    const createdAt = Date.now()
    await new Promise<void>((resolve, reject) => {
      this.db.transaction(
        (tx: any) => {
          tx.executeSql(`INSERT INTO outbox (payload, created_at) VALUES (?, ?);`, [
            JSON.stringify(payload),
            createdAt,
          ])
        },
        (err: any) => reject(err),
        () => resolve(),
      )
    })
  }

  async flush(): Promise<void> {
    // This minimal flush simply removes all outbox rows to simulate successful delivery.
    // In real implementation this would POST each payload to a server and delete on success.
    await new Promise<void>((resolve, reject) => {
      this.db.transaction(
        (tx: any) => {
          tx.executeSql(
            `SELECT id, payload FROM outbox ORDER BY created_at ASC;`,
            [],
            (_: any, result: any) => {
              const ids: number[] = []
              for (let i = 0; i < result.rows.length; i += 1) {
                const row = result.rows.item(i)
                ids.push(row.id)
              }

              for (const id of ids) {
                tx.executeSql(`DELETE FROM outbox WHERE id = ?;`, [id])
              }
            },
          )
        },
        (err: any) => reject(err),
        () => resolve(),
      )
    })
  }
}

export default SqliteSyncEngine
