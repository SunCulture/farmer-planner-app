import type { ActivityHighlight } from "./activity-highlight"

export type ActivityQuestionStatus = "pending" | "answered" | "failed"

export interface RelatedFaq {
  question: string
  previewAnswer: string
}

export interface ActivityQuestion {
  questionId: string
  question: string
  answer: string | null
  status: ActivityQuestionStatus
  relatedFaqs: RelatedFaq[]
  createdAt: string
}

export interface AnswerStreamPayload {
  questionId: string
  chunk: string
  done: boolean
  isHighlight: boolean
  highlightText: string | null
  relatedFaqs: RelatedFaq[]
  error?: string
}
