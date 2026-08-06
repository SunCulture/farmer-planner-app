export type EducationRating = "helpful" | "not_helpful"

export interface EducationProgress {
  completedCount: number
  lastCompletedAt: string | null
  lastRating: EducationRating | null
}

export interface EducationCourseListItem {
  activityId: string
  title: string
  completedCount: number
  lastCompletedAt: string | null
  lastRating: EducationRating | null
}

export interface EducationCoursesSummary {
  totals: {
    coursesCompleted: number
    totalCompletions: number
    helpfulCount: number
    notHelpfulCount: number
  }
  courses: EducationCourseListItem[]
}
