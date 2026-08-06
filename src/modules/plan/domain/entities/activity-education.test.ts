import {
  buildEducationFlashcards,
  hasExpandableEducation,
  type ActivityEducation,
} from "./activity-education"

describe("buildEducationFlashcards", () => {
  const education: ActivityEducation = {
    summary: "Scout markets before harvest.",
    whyNow: "Prices swing this week.",
    howToThink: "Treat buyers as partners.",
    practicalSteps: ["Visit two markets", "Ask about quality", "Note prices"],
  }

  it("builds content cards plus a done card", () => {
    const cards = buildEducationFlashcards(education)
    expect(cards).toHaveLength(6) // why + how + 3 steps + done
    expect(cards[0]).toMatchObject({ kind: "content", label: "Why now" })
    expect(cards[1]).toMatchObject({ kind: "content", label: "How to think about it" })
    expect(cards[2]).toMatchObject({ kind: "content", label: "Step 1 of 3" })
    expect(cards[cards.length - 1]).toEqual({ kind: "done", id: "done" })
  })

  it("skips empty sections", () => {
    const cards = buildEducationFlashcards({
      summary: "Short tip",
      whyNow: "",
      howToThink: "Focus on moisture.",
      practicalSteps: [],
    })
    expect(cards).toEqual([
      { kind: "content", id: "how-to-think", label: "How to think about it", body: "Focus on moisture." },
      { kind: "done", id: "done" },
    ])
    expect(hasExpandableEducation(education)).toBe(true)
  })
})
