import { container } from "@/bootstrap/container"

import type { Category } from "../../domain/entities/category"
import type { CategoryRepository } from "../../domain/repositories/category-repository"

function resultRowsToArray(result: any): Category[] {
  const rows: Category[] = []
  // expo-sqlite result rows expose .length and .item(i)
  for (let i = 0; i < result.rows.length; i += 1) {
    rows.push(result.rows.item(i))
  }
  return rows
}

export class SqliteCategoryRepository implements CategoryRepository {
  private db: any

  constructor(db?: any) {
    this.db = db || container.resolve("database")
    if (!this.db) throw new Error("Database not available in container")
  }

  create(name: string): Promise<Category> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx: any) => {
          tx.executeSql(
            `INSERT INTO categories (name) VALUES (?);`,
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

  findAll(): Promise<Category[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx: any) => {
          tx.executeSql(`SELECT id, name FROM categories;`, [], (_: any, result: any) => {
            resolve(resultRowsToArray(result))
          })
        },
        (err: any) => reject(err),
      )
    })
  }

  async findById(id: number): Promise<Category | undefined> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx: any) => {
          tx.executeSql(
            `SELECT id, name FROM categories WHERE id = ? LIMIT 1;`,
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

  update(category: Category): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx: any) => {
          tx.executeSql(`UPDATE categories SET name = ? WHERE id = ?;`, [
            category.name,
            category.id,
          ])
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
          tx.executeSql(`DELETE FROM categories WHERE id = ?;`, [id])
        },
        (err: any) => reject(err),
        () => resolve(),
      )
    })
  }
}

export default SqliteCategoryRepository
