import type {
  ActivityCardDto,
  ActivitySuggestionDto,
  DayPlanDto,
} from "@/services/api/planner-types"

import { mapActivityCard, mapActivitySuggestion, mapDayPlan, statusColorToUi } from "./api-mappers"

describe("api-mappers", () => {
  const activityDto: ActivityCardDto = {
    id: "a1",
    title: "Scout maize",
    subtitle: "Pest-management",
    description: "Walk rows",
    status: { code: "PENDING", label: "Not started", color: "amber" },
    iconKey: "pest-scout",
    cta: { label: "Log", route: "/activities/a1" },
  }

  it("maps activity card with emoji icon", () => {
    const card = mapActivityCard(activityDto)
    expect(card.title).toBe("Scout maize")
    expect(card.iconEmoji).toBe("🔍")
    expect(card.ctaLabel).toBe("Log")
  })

  it("maps day plan response", () => {
    const dto: DayPlanDto = {
      planId: "p1",
      date: "2026-06-03",
      dayLabel: "Tue",
      hero: { title: "Plan", summary: "Summary" },
      activities: [activityDto],
      tips: [{ id: "t1", body: "Soil is moist" }],
    }

    const plan = mapDayPlan(dto)
    expect(plan.planId).toBe("p1")
    expect(plan.activities).toHaveLength(1)
    expect(plan.tips[0].body).toBe("Soil is moist")
  })

  it("maps status colors to ui tokens", () => {
    expect(statusColorToUi("green")).toBe("good")
    expect(statusColorToUi("amber")).toBe("warn")
    expect(statusColorToUi("muted")).toBe("muted")
  })

  it("maps an activity suggestion dto", () => {
    const dto: ActivitySuggestionDto = {
      id: "s1",
      title: "Evening water check",
      description: "Check water levels and adjust valves.",
      category: "irrigation",
      timeOfDay: "evening",
      estimatedMinutes: 15,
      suggestedForDate: "2026-08-02",
      expiresAt: "2026-08-03T00:00:00.000Z",
    }

    const suggestion = mapActivitySuggestion(dto)
    expect(suggestion).toEqual(dto)
  })
})
