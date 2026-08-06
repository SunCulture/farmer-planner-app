import type { ActivityHighlight } from "./activity-highlight"

export type ActivityStatusCode =
  | "PENDING"
  | "DONE"
  | "VERIFIED"
  | "SKIPPED"
  | "REJECTED"

export interface ActivityStatus {
  code: ActivityStatusCode | string
  label: string
  color: string
}

export interface ActivityCard {
  id: string
  title: string
  subtitle?: string
  description?: string
  status: ActivityStatus
  iconKey: string
  iconEmoji: string
  ctaLabel?: string
  highlight: ActivityHighlight | null
}
