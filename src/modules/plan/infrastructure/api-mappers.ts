import type {
  ActivityCardDto,
  DayCompletionsDto,
  DayPlanDto,
  HomeDataDto,
  PlanChatResponseDto,
} from "@/services/api/planner-types"
import type { HomeDashboard } from "@/modules/home/domain/entities/home-dashboard"
import type { DayCompletions } from "@/modules/journal/domain/entities/completion"

import type { ActivityCard } from "../domain/entities/activity-card"
import type { DayPlan } from "../domain/entities/day-plan"
import type { PlanChatResult } from "../domain/entities/plan-chat"
import { iconKeyToEmoji } from "./icon-key-map"

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
  }
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

export function statusColorToUi(color: string): "good" | "warn" | "muted" {
  if (color === "green") return "good"
  if (color === "amber") return "warn"
  return "muted"
}
