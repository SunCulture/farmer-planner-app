import type { ActivityCompletion } from "@/modules/journal/domain/entities/completion"

import type { ActivityCard } from "./activity-card"

export interface ActivityDetail extends ActivityCard {
  planId: string
  date: string
  /** Short educational copy shown under “Why this matters”. */
  educationBrief?: string
  completion: ActivityCompletion | null
}
