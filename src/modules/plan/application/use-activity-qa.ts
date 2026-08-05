import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"

import { planKeys } from "@/shared/query-keys"

import type { ActivityHighlight, ActivityQuestion } from "../domain/entities/activity-qa"
import {
  applyAnswerStreamEvent,
  createPendingQuestion,
  extractHighlightFromEvent,
  removeQuestion,
} from "../domain/policies/activity-qa-policy"
import {
  askActivityQuestion,
  getQuestionsForActivity,
  parseAnswerStreamEvent,
} from "../infrastructure/activity-qa-service"
import { subscribeActivitySSE } from "../infrastructure/activity-qa-sse"

export function useActivityQA(
  activityId: string,
  onHighlight?: (highlight: ActivityHighlight, sourceQuestionId: string) => void,
) {
  const initialQuery = useQuery({
    queryKey: planKeys.activityQuestions(activityId),
    queryFn: () => getQuestionsForActivity(activityId),
    enabled: Boolean(activityId),
  })

  const [questions, setQuestions] = useState<ActivityQuestion[]>([])
  const seededRef = useRef(false)
  const onHighlightRef = useRef(onHighlight)
  onHighlightRef.current = onHighlight

  useEffect(() => {
    seededRef.current = false
    setQuestions([])
  }, [activityId])

  useEffect(() => {
    if (initialQuery.data && !seededRef.current) {
      seededRef.current = true
      setQuestions(initialQuery.data)
    }
  }, [initialQuery.data])

  useEffect(() => {
    return subscribeActivitySSE("activity_answer_stream", (payload) => {
      const event = parseAnswerStreamEvent(payload)
      if (!event) return
      setQuestions((prev) => applyAnswerStreamEvent(prev, event))
      const highlight = extractHighlightFromEvent(event)
      if (highlight) onHighlightRef.current?.(highlight, event.questionId)
    })
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

  return {
    questions,
    isLoading: initialQuery.isLoading,
    isError: initialQuery.isError,
    error: initialQuery.error,
    refetch: initialQuery.refetch,
    ask,
    retry,
    isAsking: askMutation.isPending,
  }
}
