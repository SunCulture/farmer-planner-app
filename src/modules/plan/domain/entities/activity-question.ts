import type { ActivityHighlight } from "./activity-highlight"

export type ActivityQuestionStatus = "pending" | "answered" | "failed"

export interface RelatedFaq {
  question: string
  previewAnswer: string
}

/** A single farmer-asked question and its (possibly still-pending) AI answer. */
export interface ActivityQuestion {
  questionId: string
  question: string
  answer: string | null
  status: ActivityQuestionStatus
  relatedFaqs: RelatedFaq[]
  createdAt: string
}

/**
 * Payload of the shared SSE `activity_answer_stream` event
 * (see src/shared/contracts/sse.ts). Despite the event name the current
 * backend delivers the full markdown answer in one shot — `chunk` is not
 * incremental and `done` is always true.
 */
export interface AnswerStreamPayload {
  questionId: string
  chunk: string
  done: boolean
  isHighlight: boolean
  highlightText: string | null
  relatedFaqs: RelatedFaq[]
  error?: string
}

/** One activity's Q&A grouping, as returned by `GET /me/days/:date/activity-questions`. */
export interface DayActivityQuestions {
  activityId: string
  activityTitle: string
  highlight: ActivityHighlight | null
  questions: {
    questionId: string
    question: string
    answer: string | null
    createdAt: string
  }[]
}
