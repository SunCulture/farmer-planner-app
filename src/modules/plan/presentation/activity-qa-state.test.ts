import { applyAnswerStreamEvent, upsertActivityQuestion } from "./activity-qa-state"

describe("activity-qa-state", () => {
  test("upsert inserts new question at top", () => {
    const state = upsertActivityQuestion({}, "activity-1", {
      questionId: "q-1",
      question: "How much water?",
      answer: null,
      status: "pending",
      relatedFaqs: [],
      createdAt: "2026-01-01T00:00:00.000Z",
    })

    expect(state["activity-1"]).toHaveLength(1)
    expect(state["activity-1"][0].questionId).toBe("q-1")
  })

  test("stream event marks question as failed", () => {
    const state = {
      "activity-1": [
        {
          questionId: "q-1",
          question: "How much water?",
          answer: null,
          status: "pending" as const,
          relatedFaqs: [],
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    }

    const next = applyAnswerStreamEvent(state, "q-1", {
      questionId: "q-1",
      chunk: "",
      done: true,
      isHighlight: false,
      highlightText: null,
      relatedFaqs: [],
      error: "AI failed",
    })

    expect(next["activity-1"][0].status).toBe("failed")
  })

  test("stream event sets answered question body and related faqs", () => {
    const state = {
      "activity-1": [
        {
          questionId: "q-1",
          question: "How much water?",
          answer: null,
          status: "pending" as const,
          relatedFaqs: [],
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    }

    const next = applyAnswerStreamEvent(state, "q-1", {
      questionId: "q-1",
      chunk: "Water in the morning.",
      done: true,
      isHighlight: true,
      highlightText: "Water before 9am.",
      relatedFaqs: [{ question: "How often?", previewAnswer: "Every morning." }],
    })

    expect(next["activity-1"][0].status).toBe("answered")
    expect(next["activity-1"][0].answer).toBe("Water in the morning.")
    expect(next["activity-1"][0].relatedFaqs).toHaveLength(1)
  })
})
