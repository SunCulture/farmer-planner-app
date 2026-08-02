/**
 * An AI-generated re-queue suggestion offered to the farmer after they
 * submit day feedback (see tujiweze-backend PRD-AI-Activities.md §6.6).
 *
 * Not to be confused with `SuggestionCard` in `./plan-chat.ts`, which is an
 * unrelated concept — inline prompt suggestions for the plan-audit chat
 * feature. This type models a queued activity the farmer can add to (or
 * dismiss from) an upcoming day's plan.
 */
export type ActivityTimeOfDay = "morning" | "afternoon" | "evening"

export interface ActivitySuggestion {
  id: string
  title: string
  description: string | null
  category: string | null
  timeOfDay: ActivityTimeOfDay | null
  estimatedMinutes: number | null
  suggestedForDate: string
  expiresAt: string
}
