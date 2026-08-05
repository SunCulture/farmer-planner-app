import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { ContestReaction } from "@/services/api"
import { planKeys } from "@/shared/query-keys"

import {
  contestActivity,
  markActivityDone,
  skipActivity,
} from "../infrastructure/activity-detail-service"

function invalidateActivityQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  activityId: string,
) {
  queryClient.invalidateQueries({ queryKey: planKeys.activity(activityId) })
  queryClient.invalidateQueries({ queryKey: planKeys.all })
  queryClient.invalidateQueries({ queryKey: ["home"] })
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
