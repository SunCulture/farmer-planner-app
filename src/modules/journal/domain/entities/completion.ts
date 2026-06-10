import type { ActivityStatus } from "@/modules/plan/domain/entities/activity-card"

export interface ActivityCompletion {
  id: string
  journalText: string
  photoUrls: string[]
  status: "PENDING" | "VERIFIED" | "REJECTED"
  verifiedAt?: string | null
}

export interface DayCompletionActivity {
  id: string
  title: string
  status: ActivityStatus
  completion: ActivityCompletion | null
}

export interface DayCompletions {
  date: string
  activities: DayCompletionActivity[]
}

export interface DaySummary {
  date: string
  activities: DayCompletionActivity[]
}
