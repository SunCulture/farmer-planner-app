import {
  applyAnswerStreamEvent,
  createPendingQuestion,
  extractHighlightFromEvent,
  markQuestionFailed,
  removeQuestion,
} from "./activity-qa-policy"
import type { ActivityQuestion, AnswerStreamPayload } from "../entities/activity-question"

describe("activity-qa-policy", () => {
  it("creates a pending question entry", () => {
    const q = createPendingQuestion("q1", "How do I know if the cow is in pain?")
    expect(q).toMatchObject({
      questionId: "q1",
      question: "How do I know if the cow is in pain?",
      answer: null,
      status: "pending",
      relatedFaqs: [],
    })
    expect(typeof q.createdAt).toBe("string")
  })

  const pending: ActivityQuestion = {
    questionId: "q1",
    question: "How do I know if the cow is in pain?",
    answer: null,
    status: "pending",
    relatedFaqs: [],
    createdAt: "2026-06-03T09:00:00Z",
  }

  it("applies a successful answer-stream event to the matching question", () => {
    const payload: AnswerStreamPayload = {
      questionId: "q1",
      chunk: "Look for reduced appetite.",
      done: true,
      isHighlight: false,
      highlightText: null,
      relatedFaqs: [{ question: "What if milk drops?", previewAnswer: "Check mastitis." }],
    }

    const result = applyAnswerStreamEvent([pending], payload)
    expect(result[0]).toMatchObject({
      status: "answered",
      answer: "Look for reduced appetite.",
      relatedFaqs: payload.relatedFaqs,
    })
  })

  it("marks the matching question failed when the payload carries an error", () => {
    const payload: AnswerStreamPayload = {
      questionId: "q1",
      chunk: "",
      done: true,
      isHighlight: false,
      highlightText: null,
      relatedFaqs: [],
      error: "AI provider timeout",
    }

    const result = applyAnswerStreamEvent([pending], payload)
    expect(result[0].status).toBe("failed")
  })

  it("is a no-op when the payload's questionId is not present in the list", () => {
    const payload: AnswerStreamPayload = {
      questionId: "unknown",
      chunk: "answer",
      done: true,
      isHighlight: false,
      highlightText: null,
      relatedFaqs: [],
    }

    const result = applyAnswerStreamEvent([pending], payload)
    expect(result).toEqual([pending])
  })

  it("extracts a highlight from a highlight-carrying payload", () => {
    const payload: AnswerStreamPayload = {
      questionId: "q1",
      chunk: "answer",
      done: true,
      isHighlight: true,
      highlightText: "Tip: check for ear twitching",
      relatedFaqs: [],
    }

    const highlight = extractHighlightFromEvent(payload)
    expect(highlight?.text).toBe("Tip: check for ear twitching")
    expect(typeof highlight?.addedAt).toBe("string")
  })

  it("does not extract a highlight when isHighlight is false", () => {
    const payload: AnswerStreamPayload = {
      questionId: "q1",
      chunk: "answer",
      done: true,
      isHighlight: false,
      highlightText: "Should be ignored",
      relatedFaqs: [],
    }
    expect(extractHighlightFromEvent(payload)).toBeNull()
  })

  it("does not extract a highlight when the payload carries an error", () => {
    const payload: AnswerStreamPayload = {
      questionId: "q1",
      chunk: "",
      done: true,
      isHighlight: true,
      highlightText: "Should be ignored",
      relatedFaqs: [],
      error: "failed",
    }
    expect(extractHighlightFromEvent(payload)).toBeNull()
  })

  it("removes a question by id", () => {
    const result = removeQuestion([pending], "q1")
    expect(result).toHaveLength(0)
  })

  it("marks a question failed by id", () => {
    const result = markQuestionFailed([pending], "q1")
    expect(result[0].status).toBe("failed")
  })
})
