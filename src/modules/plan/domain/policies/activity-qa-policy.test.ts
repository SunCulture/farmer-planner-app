import {
  applyAnswerStreamEvent,
  createPendingQuestion,
  extractHighlightFromEvent,
  removeQuestion,
} from "./activity-qa-policy"
import { statusColorToUi } from "./activity-status-ui"

describe("statusColorToUi", () => {
  test("maps presenter colors", () => {
    expect(statusColorToUi("green")).toBe("good")
    expect(statusColorToUi("amber")).toBe("warn")
    expect(statusColorToUi("slate")).toBe("warn")
    expect(statusColorToUi("red")).toBe("bad")
  })
})

describe("activity-qa-policy", () => {
  test("createPendingQuestion seeds pending state", () => {
    const q = createPendingQuestion("q-1", "How much water?")
    expect(q.status).toBe("pending")
    expect(q.answer).toBeNull()
  })

  test("applyAnswerStreamEvent answers matching question", () => {
    const questions = [createPendingQuestion("q-1", "How much water?")]
    const next = applyAnswerStreamEvent(questions, {
      questionId: "q-1",
      chunk: "Water early.",
      done: true,
      isHighlight: true,
      highlightText: "Water before 9am",
      relatedFaqs: [{ question: "How often?", previewAnswer: "Daily" }],
    })
    expect(next[0].status).toBe("answered")
    expect(next[0].answer).toBe("Water early.")
    expect(next[0].relatedFaqs).toHaveLength(1)
  })

  test("extractHighlightFromEvent ignores non-highlights", () => {
    expect(
      extractHighlightFromEvent({
        questionId: "q-1",
        chunk: "x",
        done: true,
        isHighlight: false,
        highlightText: null,
        relatedFaqs: [],
      }),
    ).toBeNull()

    expect(
      extractHighlightFromEvent({
        questionId: "q-1",
        chunk: "x",
        done: true,
        isHighlight: true,
        highlightText: "Tip",
        relatedFaqs: [],
      })?.text,
    ).toBe("Tip")
  })

  test("removeQuestion drops by id", () => {
    const questions = [createPendingQuestion("q-1", "A"), createPendingQuestion("q-2", "B")]
    expect(removeQuestion(questions, "q-1")).toHaveLength(1)
    expect(removeQuestion(questions, "q-1")[0].questionId).toBe("q-2")
  })
})
