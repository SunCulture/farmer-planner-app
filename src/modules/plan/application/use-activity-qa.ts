import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"

import { container } from "@/bootstrap/container"
import { loadAuthToken } from "@/modules/onboarding"
import type { SseClient } from "@/shared/contracts/sse"
import { plannerKeys } from "@/shared/query-keys"

import type { ActivityHighlight } from "../domain/entities/activity-highlight"
import type { ActivityQuestion, AnswerStreamPayload } from "../domain/entities/activity-question"
import {
  applyAnswerStreamEvent,
  createPendingQuestion,
  extractHighlightFromEvent,
  markQuestionFailed,
  removeQuestion,
} from "../domain/policies/activity-qa-policy"
import { askActivityQuestion, fetchActivityQuestions } from "../infrastructure/plan-api"

/**
 * Drives the "Ask a question" section of the activity detail screen:
 * - fetches previously answered/pending questions on mount
 * - posts new questions and shows an optimistic pending bubble
 * - subscribes once to the shared SSE `activity_answer_stream` event
 *   (resolved via `container`, never imported directly) and folds
 *   matching payloads into the local question list
 * - surfaces highlight updates via `onHighlight` so the screen can update
 *   the badge without refetching the activity
 */
export function useActivityQA(
  activityId: string,
  onHighlight?: (highlight: ActivityHighlight, sourceQuestionId: string) => void,
) {
  const initialQuery = useQuery({
    queryKey: plannerKeys.activityQuestions(activityId),
    queryFn: () => fetchActivityQuestions(activityId),
    enabled: Boolean(activityId),
  })

  const [questions, setQuestions] = useState<ActivityQuestion[]>([])
  const seededRef = useRef(false)
  const onHighlightRef = useRef(onHighlight)
  onHighlightRef.current = onHighlight

  useEffect(() => {
    if (initialQuery.data && !seededRef.current) {
      seededRef.current = true
      setQuestions(initialQuery.data)
    }
  }, [initialQuery.data])

  useEffect(() => {
    const sse = container.resolve<SseClient>("sseClient")
    if (!sse) return

    const token = loadAuthToken()
    if (token) sse.connect(token)

    const unsubscribe = sse.on<AnswerStreamPayload>("activity_answer_stream", (payload) => {
      setQuestions((prev) => applyAnswerStreamEvent(prev, payload))
      const highlight = extractHighlightFromEvent(payload)
      if (highlight) onHighlightRef.current?.(highlight, payload.questionId)
    })

    return unsubscribe
  }, [])

  const askMutation = useMutation({
    mutationFn: (question: string) => askActivityQuestion(activityId, question),
  })

  const ask = useCallback(
    async (questionText: string) => {
      const trimmed = questionText.trim()
      if (!trimmed) return
      const result = await askMutation.mutateAsync(trimmed)
      setQuestions((prev) => [...prev, createPendingQuestion(result.questionId, trimmed)])
    },
    [askMutation],
  )

  /** Re-POSTs a failed question's original text, replacing its list entry. */
  const retry = useCallback(
    async (question: ActivityQuestion) => {
      setQuestions((prev) => removeQuestion(prev, question.questionId))
      try {
        await ask(question.question)
      } catch {
        setQuestions((prev) => [...prev, { ...question, status: "failed" }])
      }
    },
    [ask],
  )

  const markFailed = useCallback((questionId: string) => {
    setQuestions((prev) => markQuestionFailed(prev, questionId))
  }, [])

  return {
    questions,
    isLoading: initialQuery.isLoading,
    isError: initialQuery.isError,
    error: initialQuery.error,
    refetch: initialQuery.refetch,
    ask,
    retry,
    markFailed,
    isAsking: askMutation.isPending,
  }
}
