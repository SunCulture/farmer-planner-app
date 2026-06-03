// In-memory journal store.
// Seeded with realistic past entries so the history view is immediately populated.
// Replace with SQLite persistence when the DB migration is wired in.

import type { JournalEntry } from "../domain/entities/journal-entry"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dateStrDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// ---------------------------------------------------------------------------
// Seeded history
// ---------------------------------------------------------------------------

type Seed = {
  daysAgo: number
  notes: string
  photoCount: number
  aiSummary?: string
  activityName?: string
  activityIcon?: string
}

const SEED: Seed[] = [
  {
    daysAgo: 1,
    notes: "Great morning! Good soil moisture today. Plants are looking healthy across all rows.",
    photoCount: 3,
    activityName: "Water crops",
    activityIcon: "💧",
    aiSummary: "Morning irrigation is well-timed. Soil moisture looks optimal — consider checking the east row tomorrow as it tends to dry faster.",
  },
  {
    daysAgo: 2,
    notes: "Tomatoes looking healthy. Need to watch the lower leaves for early blight signs.",
    photoCount: 1,
    activityName: "Pest & disease inspection",
    activityIcon: "🔍",
    aiSummary: "Early blight risk is elevated this week given humidity. A preventive copper fungicide application in 2–3 days would reduce risk.",
  },
  {
    daysAgo: 3,
    notes: "Hot day — watered twice. Yield looks strong this week. Soil holding moisture well.",
    photoCount: 0,
    aiSummary: "Double watering in heat is the right call. Consider mulching around the base of plants to retain moisture longer.",
  },
  {
    daysAgo: 4,
    notes: "Found aphids on the kale. Applied neem spray before dusk. Will check again tomorrow.",
    photoCount: 2,
    activityName: "Apply pesticide spray",
    activityIcon: "🫧",
    aiSummary: "Neem oil application is a good organic first response. Reapply after 5–7 days if colonies persist. Beneficial insects may return once pressure drops.",
  },
  {
    daysAgo: 5,
    notes: "Good harvest session. 35 bags ready for market delivery.",
    photoCount: 0,
    activityName: "Harvest kale",
    activityIcon: "🥬",
    aiSummary: "Strong yield for the season. Leaving the crown intact will allow regrowth in 2–3 weeks for a second cut.",
  },
]

let nextId = SEED.length + 1

const store: JournalEntry[] = SEED.map(({ daysAgo, notes, photoCount, aiSummary, activityName, activityIcon }, i) => ({
  id: `seed-${i + 1}`,
  date: dateStrDaysAgo(daysAgo),
  notes,
  photoCount,
  aiSummary,
  activityName,
  activityIcon,
  createdAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
}))

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getEntriesForDate(date: string): JournalEntry[] {
  return store.filter((e) => e.date === date)
}

export function getAllEntries(): JournalEntry[] {
  return [...store].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export type AddEntryOpts = {
  date: string
  notes: string
  photoCount: number
  activityId?: string
  activityName?: string
  activityIcon?: string
}

export function addEntry(opts: AddEntryOpts): JournalEntry {
  const entry: JournalEntry = {
    id: String(nextId++),
    date: opts.date,
    notes: opts.notes.trim(),
    photoCount: opts.photoCount,
    activityId: opts.activityId,
    activityName: opts.activityName,
    activityIcon: opts.activityIcon,
    createdAt: new Date().toISOString(),
  }
  store.push(entry)
  return entry
}
