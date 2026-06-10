import type { ActivityCard } from "@/modules/plan/domain/entities/activity-card"
import type { PlanTip } from "@/modules/plan/domain/entities/day-plan"

export interface WeekStripDay {
  date: string
  dayLabel: string
  isToday: boolean
  hasPlan: boolean
  statusColor: string
}

export interface TemplateCard {
  id: string
  title: string
  subtitle?: string
  description?: string
  badge?: string
  durationDays: number
  goalSlug?: string
  ctaLabel?: string
}

export interface TodaySection {
  title: string
  activities: ActivityCard[]
  tips: PlanTip[]
  ctaLabel?: string
}

export interface HomeDashboard {
  weekStrip: WeekStripDay[]
  templateCards: TemplateCard[]
  todaySection: TodaySection
  activePlanId: string | null
}

export interface PlanRecommendation {
  title: string
  description: string
  durationDays: number
  goalSlug: string
  badge: string
  ctaLabel: string
}
