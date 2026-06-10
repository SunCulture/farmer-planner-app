export type ActivityStatusCode = "PENDING" | "VERIFIED" | "REJECTED"

export interface ActivityStatus {
  code: ActivityStatusCode
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
}
