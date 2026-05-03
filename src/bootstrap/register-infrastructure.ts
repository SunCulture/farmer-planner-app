import SqliteCategoryRepository from "@/modules/expenses/infrastructure/sqlite/category-repository"
import SqliteExpenseEventRepository from "@/modules/expenses/infrastructure/sqlite/expense-event-repository"
import SqliteRoutineRepository from "@/modules/expenses/infrastructure/sqlite/routine-repository"

import { container } from "./container"

export function registerInfrastructure(db: any) {
  try {
    const categoryRepo = new SqliteCategoryRepository(db)
    container.register("categoryRepository", categoryRepo)

    const routineRepo = new SqliteRoutineRepository(db)
    container.register("routineRepository", routineRepo)

    const expenseEventRepo = new SqliteExpenseEventRepository(db)
    container.register("expenseEventRepository", expenseEventRepo)
  } catch {
    // Ignore registration errors in early development; container may already have entries
    // Errors will be surfaced when the app attempts to resolve dependencies.
  }
}

export default registerInfrastructure
