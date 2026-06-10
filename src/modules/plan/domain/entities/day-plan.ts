import type { ActivityCard } from "./activity-card"

export interface PlanHero {
  title: string
  summary: string
}

export interface PlanTip {
  id?: string
  body: string
}

export interface DayPlan {
  planId: string
  date: string
  dayLabel: string
  hero: PlanHero
  activities: ActivityCard[]
  tips: PlanTip[]
  chatCtaLabel?: string
}
