import type { ExpenseEvent } from "../entities/expense-event"

export interface ExpenseEventRepository {
  create(amount: number, categoryId?: number | null): Promise<ExpenseEvent>
  findAll(): Promise<ExpenseEvent[]>
  findById(id: number): Promise<ExpenseEvent | undefined>
  delete(id: number): Promise<void>
}

export default ExpenseEventRepository
