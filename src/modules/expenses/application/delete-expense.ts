import type SyncEngine from "@/shared/contracts/sync"

import type { ExpenseEventRepository } from "../domain/repositories/expense-event-repository"

export async function deleteExpense(
  repo: ExpenseEventRepository,
  id: number,
  syncEngine?: SyncEngine,
): Promise<void> {
  await repo.delete(id)
  try {
    if (syncEngine) {
      await syncEngine.enqueue({ type: "delete_expense", payload: { id } })
    }
  } catch {
    // ignore enqueue errors
  }
}

export default deleteExpense
