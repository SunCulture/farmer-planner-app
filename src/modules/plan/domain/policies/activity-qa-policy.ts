// Pure state-transition logic for the activity Q&A flow — no React/Expo imports,
// independently testable. Kept separate from the `use-activity-qa` hook so the
// tricky "how do we fold an SSE event into the questions list" logic can be
// unit tested without mounting a component or a fake SSE client.

import type { ActivityHighlight } from "../entities/activity-highlight"
import type { AnswerStreamPayload, ActivityQuestion } from "../entities/activity-question"

/** Builds the optimistic local entry shown immediately after a successful POST. */
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

/**
 * Folds an `activity_answer_stream` SSE payload into the current questions
 * list. No-ops if the payload's `questionId` isn't in the list (e.g. the
 * event arrived before the initial fetch/optimistic insert landed).
 */
export function applyAnswerStreamEvent(
  questions: ActivityQuestion[],
  payload: AnswerStreamPayload,
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

/** Extracts the activity highlight update carried by an answer-stream payload, if any. */
export function extractHighlightFromEvent(payload: AnswerStreamPayload): ActivityHighlight | null {
  if (payload.error || !payload.isHighlight || !payload.highlightText) return null
  return { text: payload.highlightText, addedAt: new Date().toISOString() }
}

/** Removes a question from the list, used before re-posting on retry. */
export function removeQuestion(
  questions: ActivityQuestion[],
  questionId: string,
): ActivityQuestion[] {
  return questions.filter((q) => q.questionId !== questionId)
}

/** Marks an existing question as failed, e.g. when the ask POST itself rejects. */
export function markQuestionFailed(
  questions: ActivityQuestion[],
  questionId: string,
): ActivityQuestion[] {
  return questions.map((q) =>
    q.questionId === questionId ? { ...q, status: "failed" as const } : q,
  )
}
