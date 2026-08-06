export interface ActivityEducation {
  /** Short 1–2 sentence teaser shown when collapsed. */
  summary: string
  whyNow: string
  howToThink: string
  practicalSteps: string[]
}

export type EducationFlashcard =
  | { kind: "content"; id: string; label: string; body: string }
  | { kind: "done"; id: "done" }

export function hasExpandableEducation(education: ActivityEducation): boolean {
  return (
    education.whyNow.trim().length > 0 ||
    education.howToThink.trim().length > 0 ||
    education.practicalSteps.length > 0
  )
}

/** Build Primer-style flashcards from structured education (content cards + final done card). */
export function buildEducationFlashcards(education: ActivityEducation): EducationFlashcard[] {
  const cards: EducationFlashcard[] = []

  if (education.whyNow.trim()) {
    cards.push({
      kind: "content",
      id: "why-now",
      label: "Why now",
      body: education.whyNow.trim(),
    })
  }

  if (education.howToThink.trim()) {
    cards.push({
      kind: "content",
      id: "how-to-think",
      label: "How to think about it",
      body: education.howToThink.trim(),
    })
  }

  const steps = education.practicalSteps.map((s) => s.trim()).filter(Boolean)
  steps.forEach((step, index) => {
    cards.push({
      kind: "content",
      id: `step-${index}`,
      label: `Step ${index + 1} of ${steps.length}`,
      body: step,
    })
  })

  cards.push({ kind: "done", id: "done" })
  return cards
}
