import type { ActivityAnswerStreamEvent, ActivityQuestion } from "../domain/entities/activity-qa"

export type ActivityQuestionsById = Record<string, ActivityQuestion[]>

export function upsertActivityQuestion(
  state: ActivityQuestionsById,
  activityId: string,
  question: ActivityQuestion,
): ActivityQuestionsById {
  const existing = state[activityId] ?? []
  const index = existing.findIndex((q) => q.questionId === question.questionId)
  const next = [...existing]
  if (index >= 0) {
    next[index] = question
  } else {
    next.unshift(question)
  }
  return { ...state, [activityId]: next }
}

export function applyAnswerStreamEvent(
  state: ActivityQuestionsById,
  questionId: string,
  event: ActivityAnswerStreamEvent,
): ActivityQuestionsById {
  const next: ActivityQuestionsById = { ...state }
  for (const [activityId, questions] of Object.entries(state)) {
    const idx = questions.findIndex((item) => item.questionId === questionId)
    if (idx < 0) continue
    const updated = [...questions]
    const current = updated[idx]
    updated[idx] = event.error
      ? { ...current, status: "failed" }
      : {
          ...current,
          answer: event.chunk,
          status: "answered",
          relatedFaqs: event.relatedFaqs,
        }
    next[activityId] = updated
    return next
  }
  return state
}
