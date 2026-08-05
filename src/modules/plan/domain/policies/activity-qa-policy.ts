import type {
  ActivityAnswerStreamEvent,
  ActivityHighlight,
  ActivityQuestion,
} from "../entities/activity-qa"

export function createPendingQuestion(questionId: string, question: string): ActivityQuestion {
  return {
    questionId,
    question,
    answer: null,
    status: "pending",
    relatedFaqs: [],
    createdAt: new Date().toISOString(),
  }
}

export function applyAnswerStreamEvent(
  questions: ActivityQuestion[],
  payload: ActivityAnswerStreamEvent,
): ActivityQuestion[] {
  let matched = false
  const next = questions.map((q) => {
    if (q.questionId !== payload.questionId) return q
    matched = true
    if (payload.error) {
      return { ...q, status: "failed" as const }
    }
    return {
      ...q,
      answer: payload.chunk,
      status: "answered" as const,
      relatedFaqs: payload.relatedFaqs ?? [],
    }
  })
  return matched ? next : questions
}

export function extractHighlightFromEvent(
  payload: ActivityAnswerStreamEvent,
): ActivityHighlight | null {
  if (payload.error || !payload.isHighlight || !payload.highlightText) return null
  return { text: payload.highlightText, addedAt: new Date().toISOString() }
}

export function removeQuestion(
  questions: ActivityQuestion[],
  questionId: string,
): ActivityQuestion[] {
  return questions.filter((q) => q.questionId !== questionId)
}

export function markQuestionFailed(
  questions: ActivityQuestion[],
  questionId: string,
): ActivityQuestion[] {
  return questions.map((q) =>
    q.questionId === questionId ? { ...q, status: "failed" as const } : q,
  )
}
