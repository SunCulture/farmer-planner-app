import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/services/api"
import { plannerKeys } from "@/shared/query-keys"

import type { EducationCoursesSummary, EducationRating } from "../domain/entities/education-course"

export function useStartEducationCourse(activityId: string) {
  return useMutation({
    mutationFn: () => api.startEducationCourse(activityId),
  })
}

export function useCompleteEducationCourse(activityId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.completeEducationCourse(activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.activity(activityId) })
      queryClient.invalidateQueries({ queryKey: plannerKeys.educationCourses() })
    },
  })
}

export function useRateEducationCourse(activityId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rating: EducationRating) => api.rateEducationCourse(activityId, rating),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.activity(activityId) })
      queryClient.invalidateQueries({ queryKey: plannerKeys.educationCourses() })
      if (data.briefCleared) {
        queryClient.invalidateQueries({ queryKey: plannerKeys.activity(activityId) })
      }
    },
  })
}

export function useEducationCourses() {
  return useQuery({
    queryKey: plannerKeys.educationCourses(),
    queryFn: async (): Promise<EducationCoursesSummary> => api.getEducationCourses(),
  })
}
