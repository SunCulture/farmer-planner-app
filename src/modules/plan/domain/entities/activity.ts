// Pure domain types — no framework imports

export type Priority = "High" | "Medium" | "Low"

export type PlanActivity = {
  id: string
  name: string
  title?: string
  subtitle?: string
  description?: string
  icon: string
  iconKey?: string
  priority: Priority
  durationMinutes: number
  done: boolean
  aiTip?: string
  tools?: string[]
  highlight?: {
    text: string
    addedAt: string
  } | null
}
