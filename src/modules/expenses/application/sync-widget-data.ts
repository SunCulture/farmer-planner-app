import type { CategoryRepository } from "@/modules/expenses/domain/repositories/category-repository"
import type { ExpenseEventRepository } from "@/modules/expenses/domain/repositories/expense-event-repository"
import type { RoutineRepository } from "@/modules/expenses/domain/repositories/routine-repository"

import { getWidgetState } from "./get-widget-state"

/**
 * Computes the current widget state and writes it to shared native storage
 * so the Android/iOS home-screen widget can display the predicted category
 * without launching the app.
 *
 * Call this after any routine or category change, on app foreground, and
 * after each tap is logged.
 *
 * The TappWidget native module is imported lazily so this function is safe
 * to call in environments where the native module is not present (tests, web).
 */
export async function syncWidgetData(
  categoryRepo: CategoryRepository,
  expenseRepo: ExpenseEventRepository,
  routineRepo: RoutineRepository,
): Promise<void> {
  let TappWidget: { setWidgetData: (json: string) => void } | null = null

  try {
    // Lazy import — module only exists after `expo prebuild` on a native target
    TappWidget = require("@/modules/tapp-widget").TappWidget
  } catch {
    // Not available on web or in Jest — silently skip
    return
  }

  if (!TappWidget?.setWidgetData) return

  try {
    const state = await getWidgetState(categoryRepo, expenseRepo, routineRepo)
    TappWidget.setWidgetData(JSON.stringify(state))
  } catch (err) {
    // Widget sync is best-effort; never let it break the logging path
    console.warn("syncWidgetData: failed to push widget state", err)
  }
}

export default syncWidgetData
