import type {
  ActivityCardDto,
  ActivityDetailDto,
  ActivityQuestionDto,
  ActivitySuggestionDto,
  DayActivityQuestionsDto,
  DayPlanDto,
} from "@/services/api/planner-types"

import {
  mapActivityCard,
  mapActivityDetail,
  mapActivityHighlight,
  mapActivityQuestion,
  mapActivitySuggestion,
  mapDayActivityQuestions,
  mapDayPlan,
  statusColorToUi,
} from "./api-mappers"

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

  it("maps activity card fields", () => {
    const card = mapActivityCard(activityDto)
    expect(card.title).toBe("Scout maize")
    expect(card.iconKey).toBe("pest-scout")
    expect(card.iconEmoji).toBe("")
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

  it("maps a null/undefined highlight dto to null", () => {
    expect(mapActivityHighlight(null)).toBeNull()
    expect(mapActivityHighlight(undefined)).toBeNull()
  })

  it("maps a present highlight dto", () => {
    expect(
      mapActivityHighlight({ text: "Tip: check ears", addedAt: "2026-06-03T10:00:00Z" }),
    ).toEqual({
      text: "Tip: check ears",
      addedAt: "2026-06-03T10:00:00Z",
    })
  })

  it("maps activity card highlight when present", () => {
    const card = mapActivityCard({
      ...activityDto,
      highlight: { text: "Tip: check ears", addedAt: "2026-06-03T10:00:00Z" },
    })
    expect(card.highlight).toEqual({ text: "Tip: check ears", addedAt: "2026-06-03T10:00:00Z" })
  })

  it("maps activity card highlight to null when absent", () => {
    const card = mapActivityCard(activityDto)
    expect(card.highlight).toBeNull()
  })

  it("maps activity detail, including completion, highlight, and educationBrief", () => {
    const dto: ActivityDetailDto = {
      ...activityDto,
      highlight: { text: "Tip", addedAt: "2026-06-03T10:00:00Z" },
      planId: "p1",
      date: "2026-06-03",
      educationBrief: "Why scouting matters",
      education: {
        summary: "Scout early to catch pests before they spread.",
        whyNow: "Warm weather increases pest pressure this week.",
        howToThink: "Check the underside of leaves on your maize.",
        practicalSteps: ["Walk the field slowly", "Check leaf undersides", "Note damage patterns"],
      },
      completion: {
        id: "c1",
        journalText: "Done",
        photoUrls: ["https://example.com/1.jpg"],
        status: "VERIFIED",
        verifiedAt: "2026-06-03T12:00:00Z",
      },
    }

    const detail = mapActivityDetail(dto)
    expect(detail.planId).toBe("p1")
    expect(detail.date).toBe("2026-06-03")
    expect(detail.educationBrief).toBe("Why scouting matters")
    expect(detail.education?.summary).toContain("Scout early")
    expect(detail.education?.practicalSteps).toHaveLength(3)
    expect(detail.highlight?.text).toBe("Tip")
    expect(detail.completion?.id).toBe("c1")
  })

  it("maps activity detail with null completion", () => {
    const dto: ActivityDetailDto = {
      ...activityDto,
      planId: "p1",
      date: "2026-06-03",
      completion: null,
    }
    expect(mapActivityDetail(dto).completion).toBeNull()
  })

  it("maps an activity question dto", () => {
    const dto: ActivityQuestionDto = {
      questionId: "q1",
      question: "How do I know if the cow is in pain?",
      answer: "Look for signs such as reduced appetite.",
      status: "answered",
      relatedFaqs: [{ question: "What if milk drops?", previewAnswer: "Check for mastitis." }],
      createdAt: "2026-06-03T09:00:00Z",
    }
    expect(mapActivityQuestion(dto)).toEqual(dto)
  })

  it("maps legacy activity question payloads that use id instead of questionId", () => {
    const dto = {
      id: "q-legacy",
      questionId: "",
      question: "When should I water?",
      answer: "Early morning.",
      status: "answered" as const,
      relatedFaqs: [],
      createdAt: "2026-06-03T09:00:00Z",
    }
    expect(mapActivityQuestion(dto)).toMatchObject({
      questionId: "q-legacy",
      question: "When should I water?",
    })
  })

  it("maps day activity questions, mapping highlight per activity", () => {
    const dto: DayActivityQuestionsDto = [
      {
        activityId: "a1",
        activityTitle: "Milking",
        highlight: { text: "Tip", addedAt: "2026-06-03T10:00:00Z" },
        questions: [
          { questionId: "q1", question: "Q?", answer: "A.", createdAt: "2026-06-03T09:00:00Z" },
        ],
      },
      {
        activityId: "a2",
        activityTitle: "Feeding",
        highlight: null,
        questions: [],
      },
    ]

    const result = mapDayActivityQuestions(dto)
    expect(result).toHaveLength(2)
    expect(result[0].highlight?.text).toBe("Tip")
    expect(result[1].highlight).toBeNull()
    expect(result[1].questions).toHaveLength(0)
  })
})
