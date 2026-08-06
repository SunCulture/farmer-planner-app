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

export interface ActivityHighlightDto {
  text: string
  addedAt: string
}

export interface ActivityCardDto {
  id: string
  title: string
  subtitle?: string
  description?: string
  status: ActivityStatusDto
  iconKey: string
  cta?: ActivityCtaDto
  highlight?: ActivityHighlightDto | null
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

export interface ActivityEducationDto {
  summary: string
  whyNow: string
  howToThink: string
  practicalSteps: string[]
}

export interface EducationProgressDto {
  completedCount: number
  lastCompletedAt: string | null
  lastRating: "helpful" | "not_helpful" | null
}

export interface ActivityDetailDto extends ActivityCardDto {
  planId: string
  date: string
  educationBrief?: string
  education?: ActivityEducationDto | null
  educationProgress?: EducationProgressDto | null
  completion: ActivityCompletionDto | null
}

export interface EducationCoursesDto {
  totals: {
    coursesCompleted: number
    totalCompletions: number
    helpfulCount: number
    notHelpfulCount: number
  }
  courses: Array<{
    activityId: string
    title: string
    completedCount: number
    lastCompletedAt: string | null
    lastRating: "helpful" | "not_helpful" | null
  }>
}

export interface ActivityCompletionDto {
  id: string
  journalText: string
  photoUrls: string[]
  status: "PENDING" | "VERIFIED" | "REJECTED"
  verifiedAt?: string | null
}

// ---- Activity Q&A ---------------------------------------------------------

export type ActivityQuestionStatusDto = "pending" | "answered" | "failed"

export interface RelatedFaqDto {
  question: string
  previewAnswer: string
}

export interface ActivityQuestionDto {
  questionId: string
  question: string
  answer: string | null
  status: ActivityQuestionStatusDto
  relatedFaqs: RelatedFaqDto[]
  createdAt: string
}

export interface ActivityQuestionsListDto {
  questions: ActivityQuestionDto[]
}

export interface AskActivityQuestionBody {
  question: string
}

export interface AskActivityQuestionResponseDto {
  questionId: string
  question: string
  status: "pending"
}

export interface DayActivityQuestionEntryDto {
  activityId: string
  activityTitle: string
  highlight: ActivityHighlightDto | null
  questions: {
    questionId: string
    question: string
    answer: string | null
    createdAt: string
  }[]
}

export type DayActivityQuestionsDto = DayActivityQuestionEntryDto[]

// ---- Journal / completions --------------------------------------------------

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

// ---- Activity suggestions (AI re-queue, see backend#11/#12) ----------------

export interface ActivitySuggestionDto {
  id: string
  title: string
  description: string | null
  category: string | null
  timeOfDay: "morning" | "afternoon" | "evening" | null
  estimatedMinutes: number | null
  suggestedForDate: string
  expiresAt: string
}

/** Response of `POST /me/activity-suggestions/:id/accept` — a normal
 * activity card plus the plan/day it was appended to. */
export interface AcceptSuggestionResponseDto extends ActivityCardDto {
  planId: string
  date: string
}
