import { container } from "@/bootstrap/container"

import type { Routine } from "../../domain/entities/routine"
import type { RoutineRepository } from "../../domain/repositories/routine-repository"

function resultRowsToArray(result: any): Routine[] {
  const rows: Routine[] = []
  for (let i = 0; i < result.rows.length; i += 1) {
    rows.push(result.rows.item(i))
  }
  return rows
}

export class SqliteRoutineRepository implements RoutineRepository {
  private db: any

  constructor(db?: any) {
    this.db = db || container.resolve("database")
    if (!this.db) throw new Error("Database not available in container")
  }

  create(name: string): Promise<Routine> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx: any) => {
          tx.executeSql(
            `INSERT INTO routines (name) VALUES (?);`,
            [name],
            (_: any, result: any) => {
              const id = result.insertId
              resolve({ id, name })
            },
          )
        },
        (err: any) => reject(err),
      )
    })
  }

  findAll(): Promise<Routine[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx: any) => {
          tx.executeSql(`SELECT id, name FROM routines;`, [], (_: any, result: any) => {
            resolve(resultRowsToArray(result))
          })
        },
        (err: any) => reject(err),
      )
    })
  }

  async findById(id: number): Promise<Routine | undefined> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx: any) => {
          tx.executeSql(
            `SELECT id, name FROM routines WHERE id = ? LIMIT 1;`,
            [id],
            (_: any, result: any) => {
              const rows = resultRowsToArray(result)
              resolve(rows.length ? rows[0] : undefined)
            },
          )
        },
        (err: any) => reject(err),
      )
    })
  }

  update(routine: Routine): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx: any) => {
          tx.executeSql(`UPDATE routines SET name = ? WHERE id = ?;`, [routine.name, routine.id])
        },
        (err: any) => reject(err),
        () => resolve(),
      )
    })
  }

  delete(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx: any) => {
          tx.executeSql(`DELETE FROM routines WHERE id = ?;`, [id])
        },
        (err: any) => reject(err),
        () => resolve(),
      )
    })
  }
}

export default SqliteRoutineRepository
