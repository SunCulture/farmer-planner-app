// Shared API response shapes for planner endpoints (from Tujiweze Postman collection)

export interface ActivityStatusDto {
  code: "PENDING" | "VERIFIED" | "REJECTED"
  label: string
  color: string
}

export interface ActivityCtaDto {
  label: string
  route: string
}

export interface ActivityCardDto {
  id: string
  title: string
  subtitle?: string
  description?: string
  status: ActivityStatusDto
  iconKey: string
  cta?: ActivityCtaDto
}

export interface PlanTipDto {
  id?: string
  body: string
  type?: string
}

export interface PlanHeroDto {
  title: string
  summary: string
  badge?: string
  durationLabel?: string
  startDate?: string
}

export interface WeekStripDayDto {
  date: string
  dayLabel: string
  isToday: boolean
  hasPlan: boolean
  statusColor: string
}

export interface TemplateCardDto {
  id: string
  title: string
  subtitle?: string
  description?: string
  badge?: string
  durationDays: number
  goalSlug?: string
  ctaLabel?: string
}

export interface TodaySectionDto {
  title: string
  activities: ActivityCardDto[]
  tips: PlanTipDto[]
  cta?: ActivityCtaDto
}

export interface HomeDataDto {
  weekStrip: WeekStripDayDto[]
  templateCards: TemplateCardDto[]
  todaySection: TodaySectionDto
  activePlanId: string | null
}

export interface PlanRecommendationDto {
  title: string
  description: string
  durationDays: number
  goalSlug: string
  badge: string
  ctaLabel: string
}

export interface PlanTemplateDto {
  id: string
  title: string
  durationDays: number
  goalSlug: string
  description: string
}

export interface DayPlanDto {
  planId: string
  date: string
  dayLabel: string
  hero: PlanHeroDto
  activities: ActivityCardDto[]
  tips: PlanTipDto[]
  chatCta?: ActivityCtaDto
}

export interface GeneratedPlanDayDto {
  dayNumber: number
  date: string
  dayLabel: string
  theme?: string
  activities: ActivityCardDto[]
  tips: PlanTipDto[]
}

export interface GeneratedPlanDto {
  planId: string
  hero: PlanHeroDto
  days: GeneratedPlanDayDto[]
  cta?: ActivityCtaDto
}

export interface ActivityDetailDto extends ActivityCardDto {
  planId: string
  date: string
  completion: ActivityCompletionDto | null
}

export interface ActivityCompletionDto {
  id: string
  journalText: string
  photoUrls: string[]
  status: "PENDING" | "VERIFIED" | "REJECTED"
  verifiedAt?: string | null
}

export interface DayCompletionActivityDto {
  id: string
  title: string
  status: ActivityStatusDto
  completion: (ActivityCompletionDto & { activityId?: string }) | null
}

export interface DayCompletionsDto {
  date: string
  activities: DayCompletionActivityDto[]
}

export interface ChatSuggestionCardDto {
  id: string
  action: "add" | "update" | "remove"
  title: string
  reason: string
  ctaLabel: string
  planDayId?: string
}

export interface PlanChatResponseDto {
  messageId: string
  reply: {
    markdown: string
    plain: string
  }
  confidence: string
  suggestionCards: ChatSuggestionCardDto[]
}

export interface PatchPlanActivityDto {
  id?: string
  planDayId: string
  title: string
  description?: string
  sortOrder: number
  category?: string
  delete?: boolean
}

export interface PatchPlanBody {
  activities: PatchPlanActivityDto[]
}

export interface EnrollPlanBody {
  templateId: string
  startDate?: string
}

export interface GeneratePlanBody {
  durationDays: number
  startDate?: string
}
