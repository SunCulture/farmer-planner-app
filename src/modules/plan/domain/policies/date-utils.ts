/** Pure date helpers for suggestion-banner date math. Format is always YYYY-MM-DD. */

export function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function todayDateStr(now: Date = new Date()): string {
  return toDateStr(now)
}

/** Adds `days` (may be negative) to a YYYY-MM-DD string, returning YYYY-MM-DD. */
export function addDaysToDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return toDateStr(date)
}
