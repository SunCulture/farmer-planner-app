export const plannerKeys = {
  all: ["planner"] as const,
  home: () => ["planner", "home"] as const,
  dayPlan: (date: string) => ["planner", "dayPlan", date] as const,
  dayCompletions: (date: string) => ["planner", "completions", date] as const,
  activity: (id: string) => ["planner", "activity", id] as const,
  activityQuestions: (id: string) => ["planner", "activity", id, "questions"] as const,
  dayActivityQuestions: (date: string) => ["planner", "dayActivityQuestions", date] as const,
  recommendations: () => ["planner", "recommendations"] as const,
  templates: (filters: { goal?: string; durationDays?: number }) =>
    ["planner", "templates", filters] as const,
  suggestions: (date: string) => ["planner", "suggestions", date] as const,
}

export default plannerKeys
