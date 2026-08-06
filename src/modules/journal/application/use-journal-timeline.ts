import { useQueries } from "@tanstack/react-query"

import { plannerKeys } from "@/shared/query-keys"

import type { DaySummary } from "../domain/entities/completion"
import { fetchDayCompletions } from "../infrastructure/journal-api"

function dateStrDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function buildTimelineDates(dayCount = 14): string[] {
  const today = todayStr()
  return [today, ...Array.from({ length: dayCount - 1 }, (_, i) => dateStrDaysAgo(i + 1))]
}

export function useJournalTimeline(dates: string[]) {
  const queries = useQueries({
    queries: dates.map((date) => ({
      queryKey: plannerKeys.dayCompletions(date),
      queryFn: () => fetchDayCompletions(date),
    })),
  })

  const timeline: DaySummary[] = dates.map((date, i) => ({
    date,
    activities: (queries[i].data?.activities ?? []).filter((a) => a.completion !== null),
  }))

  return {
    timeline,
    isLoading: queries.some((q) => q.isLoading),
    error: queries.find((q) => q.isError)?.error,
    refetchAll: () => queries.forEach((q) => q.refetch()),
  }
}
