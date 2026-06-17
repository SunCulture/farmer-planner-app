import { getGeneralApiProblem } from "@/services/api/apiProblem"
import { api } from "@/services/api"
import type {
  ActivityAnswerStreamEvent,
  ActivityHighlight,
  ActivityQuestion,
  AskQuestionAck,
  DayActivityQuestions,
  RelatedFaq,
} from "../domain/entities/activity-qa"

type ActivityQaProblemKind =
  | "cannot-connect"
  | "timeout"
  | "server"
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "rejected"
  | "unknown"
  | "bad-data"

export class ActivityQaError extends Error {
  kind: ActivityQaProblemKind
  temporary: boolean

  constructor(kind: ActivityQaProblemKind, message: string, temporary = false) {
    super(message)
    this.kind = kind
    this.temporary = temporary
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuidLike(value: string): boolean {
  return UUID_PATTERN.test(value)
}

function mapApiProblem(response: any): ActivityQaError | null {
  const problem = getGeneralApiProblem(response)
  if (!problem) return null
  const temporary = "temporary" in problem ? !!problem.temporary : false
  return new ActivityQaError(problem.kind, `Activity Q&A request failed: ${problem.kind}`, temporary)
}

function normalizeRelatedFaqs(value: unknown): RelatedFaq[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const question = typeof (item as any).question === "string" ? (item as any).question : ""
      const previewAnswer =
        typeof (item as any).previewAnswer === "string" ? (item as any).previewAnswer : ""
      if (!question || !previewAnswer) return null
      return { question, previewAnswer }
    })
    .filter((item): item is RelatedFaq => item !== null)
}

function normalizeQuestion(raw: any): ActivityQuestion | null {
  if (!raw || typeof raw !== "object") return null
  const questionId = typeof raw.questionId === "string" ? raw.questionId : raw.id
  if (typeof questionId !== "string" || typeof raw.question !== "string") return null
  const status = raw.status === "answered" || raw.status === "failed" ? raw.status : "pending"
  return {
    questionId,
    question: raw.question,
    answer: typeof raw.answer === "string" ? raw.answer : null,
    status,
    relatedFaqs: normalizeRelatedFaqs(raw.relatedFaqs),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
  }
}

export async function askActivityQuestion(activityId: string, question: string): Promise<AskQuestionAck> {
  if (!isUuidLike(activityId)) {
    throw new ActivityQaError(
      "bad-data",
      "Activity Q&A is unavailable for local fallback activities",
    )
  }
  const response = await api.askActivityQuestion(activityId, { question })
  const problem = mapApiProblem(response)
  if (problem) throw problem

  const ack = response.data?.data
  if (!ack?.questionId || typeof ack.question !== "string") {
    throw new ActivityQaError("bad-data", "Ask question response is missing required fields")
  }

  return {
    questionId: ack.questionId,
    question: ack.question,
    status: ack.status === "answered" || ack.status === "failed" ? ack.status : "pending",
  }
}

export async function getQuestionsForActivity(activityId: string): Promise<ActivityQuestion[]> {
  if (!isUuidLike(activityId)) {
    return []
  }
  const response = await api.getActivityQuestions(activityId)
  const problem = mapApiProblem(response)
  if (problem) throw problem

  const questions = response.data?.data?.questions ?? response.data?.questions ?? []
  if (!Array.isArray(questions)) {
    throw new ActivityQaError("bad-data", "Questions response is not an array")
  }

  return questions.map(normalizeQuestion).filter((q): q is ActivityQuestion => q !== null)
}

export async function getDayActivityQuestions(date: string): Promise<DayActivityQuestions[]> {
  const response = await api.getDayActivityQuestions(date)
  const problem = mapApiProblem(response)
  if (problem) throw problem

  const rows = response.data?.data?.activities ?? response.data?.activities ?? []
  if (!Array.isArray(rows)) {
    throw new ActivityQaError("bad-data", "Day activity questions response is not an array")
  }

  return rows.map((row: any) => ({
    activityId: typeof row?.activityId === "string" ? row.activityId : "",
    activityTitle: typeof row?.activityTitle === "string" ? row.activityTitle : "",
    highlight: row?.highlight && typeof row.highlight.text === "string"
      ? ({ text: row.highlight.text, addedAt: String(row.highlight.addedAt ?? "") } as ActivityHighlight)
      : null,
    questions: Array.isArray(row?.questions)
      ? row.questions
          .filter((q: any) => q && typeof q.questionId === "string")
          .map((q: any) => ({
            questionId: q.questionId,
            question: typeof q.question === "string" ? q.question : "",
            answer: typeof q.answer === "string" ? q.answer : null,
            createdAt: typeof q.createdAt === "string" ? q.createdAt : new Date().toISOString(),
          }))
      : [],
  })).filter((item) => item.activityId.length > 0)
}

export function parseAnswerStreamEvent(payload: unknown): ActivityAnswerStreamEvent | null {
  if (!payload || typeof payload !== "object") return null
  const raw = payload as any
  if (typeof raw.questionId !== "string") return null
  return {
    questionId: raw.questionId,
    chunk: typeof raw.chunk === "string" ? raw.chunk : "",
    done: !!raw.done,
    isHighlight: !!raw.isHighlight,
    highlightText: typeof raw.highlightText === "string" ? raw.highlightText : null,
    relatedFaqs: normalizeRelatedFaqs(raw.relatedFaqs),
    error: typeof raw.error === "string" ? raw.error : undefined,
  }
}
