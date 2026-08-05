import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { ContestReaction } from "@/services/api/planner-types"
import { plannerKeys } from "@/shared/query-keys"

import {
  contestActivity,
  markActivityDone,
  skipActivity,
} from "../infrastructure/plan-api"

function invalidateActivityQueries(queryClient: ReturnType<typeof useQueryClient>, activityId: string) {
  queryClient.invalidateQueries({ queryKey: plannerKeys.activity(activityId) })
  queryClient.invalidateQueries({ queryKey: plannerKeys.home() })
  queryClient.invalidateQueries({ queryKey: plannerKeys.all })
}

export function useMarkActivityDone(activityId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markActivityDone(activityId),
    onSuccess: () => invalidateActivityQueries(queryClient, activityId),
  })
}

export function useSkipActivity(activityId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (note?: string) => skipActivity(activityId, note),
    onSuccess: () => invalidateActivityQueries(queryClient, activityId),
  })
}

export function useContestActivity(activityId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { reaction: ContestReaction; note: string }) =>
      contestActivity(activityId, input.reaction, input.note),
    onSuccess: () => invalidateActivityQueries(queryClient, activityId),
  })
}
