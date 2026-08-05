import type { ActivityHighlight } from "./activity-qa"

export type ActivityStatusCode = "PENDING" | "DONE" | "VERIFIED" | "SKIPPED" | "REJECTED"

export type ActivityStatus = {
  code: ActivityStatusCode | string
  label: string
  color: string
}

export type ActivityCompletion = {
  id: string
  journalText: string | null
  photoUrls: string[]
  status: string
  outcomeNote: string | null
  verifiedAt: string | null
}

export type ActivityDetail = {
  id: string
  title: string
  subtitle?: string
  description?: string
  educationBrief?: string
  status: ActivityStatus
  iconKey: string
  iconEmoji: string
  planId: string
  date: string
  highlight: ActivityHighlight | null
  completion: ActivityCompletion | null
}
