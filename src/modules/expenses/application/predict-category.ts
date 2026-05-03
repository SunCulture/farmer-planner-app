import type { CategoryRepository } from "@/modules/expenses/domain/repositories/category-repository"
import type { ExpenseEventRepository } from "@/modules/expenses/domain/repositories/expense-event-repository"

/**
 * Simple V1 predictor:
 * 1. Use time-of-day buckets (Breakfast/Lunch/Dinner) and try to match a Category by name.
 * 2. Fallback: use historical frequency for the same time bucket and return the most common category.
 * Returns category id or null when none can be determined.
 */
export async function predictCategory(
  categoryRepo: CategoryRepository,
  expenseRepo: ExpenseEventRepository,
  nowMs?: number,
): Promise<number | null> {
  const categories = await categoryRepo.findAll()

  const now = new Date(nowMs ?? Date.now())
  const hour = now.getHours()

  function timeBucketForHour(h: number): string | null {
    if (h >= 6 && h < 11) return "breakfast"
    if (h >= 11 && h < 14) return "lunch"
    if (h >= 17 && h < 21) return "dinner"
    return null
  }

  const bucket = timeBucketForHour(hour)
  if (bucket) {
    const match = categories.find((c) => c.name.toLowerCase().includes(bucket))
    if (match && match.id) return match.id
  }

  // historical fallback: look for the most frequent category used in the same hour window
  const events = await expenseRepo.findAll()
  const eventsInWindow = events.filter((e) => {
    if (!e.created_at) return false
    const d = new Date(e.created_at)
    const h = d.getHours()
    if (!bucket) return true
    // simple window logic: assign hours that match the same bucket
    return timeBucketForHour(h) === bucket
  })

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

  return bestId
}

export default predictCategory
