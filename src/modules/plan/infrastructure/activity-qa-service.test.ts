import { parseAnswerStreamEvent } from "./activity-qa-service"

describe("parseAnswerStreamEvent", () => {
  test("returns null for invalid payload", () => {
    expect(parseAnswerStreamEvent(null)).toBeNull()
    expect(parseAnswerStreamEvent({})).toBeNull()
  })

  test("normalizes expected fields", () => {
    const event = parseAnswerStreamEvent({
      questionId: "q-1",
      chunk: "Use drip irrigation.",
      done: true,
      isHighlight: true,
      highlightText: "Drip irrigation saves water.",
      relatedFaqs: [{ question: "When?", previewAnswer: "Morning." }],
    })

    expect(event).not.toBeNull()
    expect(event?.questionId).toBe("q-1")
    expect(event?.relatedFaqs).toHaveLength(1)
    expect(event?.done).toBe(true)
  })
})
