import type { CategoryRepository } from "@/modules/expenses/domain/repositories/category-repository"
import type { ExpenseEventRepository } from "@/modules/expenses/domain/repositories/expense-event-repository"
import type { RoutineRepository } from "@/modules/expenses/domain/repositories/routine-repository"

/** Convert a Date to minutes from midnight (0–1439). */
function toMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

/**
 * Returns the JS day-of-week bit for a Date.
 * Sunday=bit0 … Saturday=bit6, matching the Routine.days_of_week bitmask.
 */
function dayBit(date: Date): number {
  return 1 << date.getDay()
}

/**
 * V1 prediction pipeline:
 * 1. Match current time against user-configured routine windows (primary).
 * 2. Fall back to historical frequency for the same time-of-day window.
 * 3. Fall back to the first category found.
 *
 * Returns the predicted category id, or null when no categories exist at all.
 */
export async function predictCategory(
  categoryRepo: CategoryRepository,
  expenseRepo: ExpenseEventRepository,
  routineRepo?: RoutineRepository,
  nowMs?: number,
): Promise<number | null> {
  const now = new Date(nowMs ?? Date.now())
  const currentMinutes = toMinutes(now)
  const currentDayBit = dayBit(now)

  // 1. Routine-window match
  if (routineRepo) {
    const routines = await routineRepo.findAll()
    const match = routines.find(
      (r) =>
        r.category_id &&
        (r.days_of_week & currentDayBit) !== 0 &&
        currentMinutes >= r.time_start &&
        currentMinutes < r.time_end,
    )
    if (match?.category_id) return match.category_id
  }

  // 2. Historical frequency fallback — find the most common category used within
  //    ±90 minutes of the current time across all past events
  const events = await expenseRepo.findAll()
  const WINDOW_MINUTES = 90
  const eventsInWindow = events.filter((e) => {
    if (!e.created_at) return false
    const pastMinutes = toMinutes(new Date(e.created_at))
    const diff = Math.abs(pastMinutes - currentMinutes)
    // Handle midnight wrap-around (e.g. 23:45 vs 00:15)
    return Math.min(diff, 1440 - diff) <= WINDOW_MINUTES
  })

  if (eventsInWindow.length > 0) {
    const counts = new Map<number, number>()
    for (const ev of eventsInWindow) {
      if (!ev.category_id) continue
      counts.set(ev.category_id as number, (counts.get(ev.category_id as number) ?? 0) + 1)
    }
    let bestId: number | null = null
    let bestCount = 0
    for (const [id, c] of counts.entries()) {
      if (c > bestCount) {
        bestCount = c
        bestId = id
      }
    }
    if (bestId !== null) return bestId
  }

  // 3. First category fallback
  const categories = await categoryRepo.findAll()
  return categories.length ? (categories[0].id ?? null) : null
}

export default predictCategory
