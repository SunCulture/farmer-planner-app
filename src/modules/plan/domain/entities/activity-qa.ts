export type ActivityHighlight = {
  text: string
  addedAt: string
}

export type RelatedFaq = {
  question: string
  previewAnswer: string
}

export type ActivityQuestionStatus = "pending" | "answered" | "failed"

export type ActivityQuestion = {
  questionId: string
  question: string
  answer: string | null
  status: ActivityQuestionStatus
  relatedFaqs: RelatedFaq[]
  createdAt: string
}

export type DayActivityQuestions = {
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

export type AskQuestionAck = {
  questionId: string
  question: string
  status: ActivityQuestionStatus
}

export type ActivityAnswerStreamEvent = {
  questionId: string
  chunk: string
  done: boolean
  isHighlight: boolean
  highlightText: string | null
  relatedFaqs: RelatedFaq[]
  error?: string
}
