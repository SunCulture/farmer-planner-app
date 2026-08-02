/**
 * Decides whether the persistent "AI suggestions" banner should show, and
 * which date it should open the sheet against, given pending-suggestion
 * counts for today and tomorrow. Today takes priority over tomorrow.
 */
export function pickBannerDate(
  today: string,
  tomorrow: string,
  todayCount: number,
  tomorrowCount: number,
): string | null {
  if (todayCount > 0) return today
  if (tomorrowCount > 0) return tomorrow
  return null
}
