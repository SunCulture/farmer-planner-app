import type { ActivityCompletion } from "@/modules/journal/domain/entities/completion"

import type { ActivityCard } from "./activity-card"
import type { ActivityEducation } from "./activity-education"
import type { EducationProgress } from "./education-course"

export interface ActivityDetail extends ActivityCard {
  planId: string
  date: string
  /** Legacy plain educational copy (usually the summary). */
  educationBrief?: string
  /** Structured education with summary + expandable sections. */
  education?: ActivityEducation | null
  educationProgress?: EducationProgress | null
  completion: ActivityCompletion | null
}
