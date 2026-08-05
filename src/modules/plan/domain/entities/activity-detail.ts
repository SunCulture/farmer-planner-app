import type { ActivityCompletion } from "@/modules/journal/domain/entities/completion"

import type { ActivityCard } from "./activity-card"
import type { ActivityHighlight } from "./activity-highlight"

export interface ActivityDetail extends ActivityCard {
  planId: string
  date: string
  educationBrief?: string
  highlight: ActivityHighlight | null
  completion: ActivityCompletion | null
}
