// Pure domain types — no framework imports

export type JournalEntry = {
  id: string
  date: string          // "YYYY-MM-DD"
  activityId?: string
  activityName?: string
  activityIcon?: string
  notes: string
  photoCount: number
  aiSummary?: string
  createdAt: string
}
