import type { HomeDashboard } from "@/modules/home/domain/entities/home-dashboard"
import type { DayCompletions } from "@/modules/journal/domain/entities/completion"
import type {
  ActivityCardDto,
  ActivitySuggestionDto,
  ActivityDetailDto,
  ActivityHighlightDto,
  ActivityQuestionDto,
  DayActivityQuestionsDto,
  DayCompletionsDto,
  DayPlanDto,
  HomeDataDto,
  PlanChatResponseDto,
} from "@/services/api/planner-types"

import { iconKeyToEmoji } from "./icon-key-map"
import type { ActivityCard } from "../domain/entities/activity-card"
import type { ActivityDetail } from "../domain/entities/activity-detail"
import type { ActivityEducation } from "../domain/entities/activity-education"
import type { ActivityHighlight } from "../domain/entities/activity-highlight"
import type { ActivityQuestion, DayActivityQuestions } from "../domain/entities/activity-question"
import type { ActivitySuggestion } from "../domain/entities/activity-suggestion"
import type { DayPlan } from "../domain/entities/day-plan"
import type { PlanChatResult } from "../domain/entities/plan-chat"

function mapActivityEducation(
  dto: ActivityDetailDto["education"] | undefined,
): ActivityEducation | null {
  if (!dto || typeof dto.summary !== "string") return null
  return {
    summary: dto.summary,
    whyNow: typeof dto.whyNow === "string" ? dto.whyNow : "",
    howToThink: typeof dto.howToThink === "string" ? dto.howToThink : "",
    practicalSteps: Array.isArray(dto.practicalSteps)
      ? dto.practicalSteps.filter((s): s is string => typeof s === "string")
      : [],
  }
}

export function mapActivityHighlight(
  dto: ActivityHighlightDto | null | undefined,
): ActivityHighlight | null {
  if (!dto) return null
  return { text: dto.text, addedAt: dto.addedAt }
}

export function mapActivityCard(dto: ActivityCardDto): ActivityCard {
  return {
    id: dto.id,
    title: dto.title,
    subtitle: dto.subtitle,
    description: dto.description,
    status: dto.status,
    iconKey: dto.iconKey,
    iconEmoji: iconKeyToEmoji(dto.iconKey),
    ctaLabel: dto.cta?.label,
    highlight: mapActivityHighlight(dto.highlight),
  }
}

export function mapActivityDetail(dto: ActivityDetailDto): ActivityDetail {
  return {
    ...mapActivityCard(dto),
    planId: dto.planId,
    date: dto.date,
    educationBrief: dto.educationBrief,
    education: mapActivityEducation(dto.education),
    educationProgress: dto.educationProgress
      ? {
          completedCount: dto.educationProgress.completedCount,
          lastCompletedAt: dto.educationProgress.lastCompletedAt,
          lastRating: dto.educationProgress.lastRating,
        }
      : null,
    completion: dto.completion
      ? {
          id: dto.completion.id,
          journalText: dto.completion.journalText,
          photoUrls: dto.completion.photoUrls,
          status: dto.completion.status,
          verifiedAt: dto.completion.verifiedAt,
        }
      : null,
  }
}

export function mapActivityQuestion(dto: ActivityQuestionDto): ActivityQuestion {
  // Backend historically returned `id`; prefer `questionId` but accept both.
  const legacyId = (dto as ActivityQuestionDto & { id?: string }).id
  const questionId =
    typeof dto.questionId === "string" && dto.questionId.length > 0
      ? dto.questionId
      : typeof legacyId === "string"
        ? legacyId
        : ""

  return {
    questionId,
    question: dto.question,
    answer: dto.answer,
    status: dto.status,
    relatedFaqs: dto.relatedFaqs ?? [],
    createdAt: dto.createdAt,
  }
}

export function mapDayActivityQuestions(dto: DayActivityQuestionsDto): DayActivityQuestions[] {
  return dto.map((entry) => ({
    activityId: entry.activityId,
    activityTitle: entry.activityTitle,
    highlight: mapActivityHighlight(entry.highlight),
    questions: entry.questions,
  }))
}

export function mapDayPlan(dto: DayPlanDto): DayPlan {
  return {
    planId: dto.planId,
    date: dto.date,
    dayLabel: dto.dayLabel,
    hero: dto.hero,
    activities: dto.activities.map(mapActivityCard),
    tips: dto.tips.map((t) => ({ id: t.id, body: t.body })),
    chatCtaLabel: dto.chatCta?.label,
  }
}

export function mapHomeDashboard(dto: HomeDataDto): HomeDashboard {
  return {
    weekStrip: dto.weekStrip,
    templateCards: dto.templateCards,
    todaySection: {
      title: dto.todaySection.title,
      activities: dto.todaySection.activities.map(mapActivityCard),
      tips: dto.todaySection.tips.map((t) => ({ id: t.id, body: t.body })),
      ctaLabel: dto.todaySection.cta?.label,
    },
    activePlanId: dto.activePlanId,
    activePlan: dto.activePlan
      ? {
          id: dto.activePlan.id,
          title: dto.activePlan.title,
          summary: dto.activePlan.summary,
          durationDays: dto.activePlan.durationDays,
        }
      : null,
  }
}

export function mapDayCompletions(dto: DayCompletionsDto): DayCompletions {
  return {
    date: dto.date,
    activities: dto.activities.map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      completion: a.completion
        ? {
            id: a.completion.id,
            journalText: a.completion.journalText,
            photoUrls: a.completion.photoUrls,
            status: a.completion.status,
            verifiedAt: a.completion.verifiedAt,
          }
        : null,
    })),
  }
}

export function mapPlanChatResult(dto: PlanChatResponseDto): PlanChatResult {
  return {
    messageId: dto.messageId,
    reply: dto.reply,
    confidence: dto.confidence,
    suggestionCards: dto.suggestionCards,
  }
}

export function mapActivitySuggestion(dto: ActivitySuggestionDto): ActivitySuggestion {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    category: dto.category,
    timeOfDay: dto.timeOfDay,
    estimatedMinutes: dto.estimatedMinutes,
    suggestedForDate: dto.suggestedForDate,
    expiresAt: dto.expiresAt,
  }
}

export function statusColorToUi(color: string): "good" | "warn" | "muted" {
  if (color === "green") return "good"
  if (color === "amber") return "warn"
  return "muted"
}
