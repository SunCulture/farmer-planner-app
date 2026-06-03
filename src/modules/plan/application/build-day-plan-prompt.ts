// Types -----------------------------------------------------------------------

export type FarmingStage =
  | "pre-planting"
  | "planting"
  | "growing"
  | "harvesting"
  | "post-harvest"

export type FarmerProfile = {
  name: string
  region: string
  /** Inferred from region if not supplied by the farmer explicitly */
  soilType?: string
  crops: string[]
  animals?: string[]
}

export type FarmingConditions = {
  /** Plain-language weather summary, e.g. "Light rains expected. Temp 18–26°C." */
  weatherSummary: string
  soilCondition?: string
  waterAvailability?: string
  /** Pests or diseases reported nearby, e.g. ["fall armyworm", "leaf rust"] */
  diseasesReported?: string[]
}

export type FarmerGoals = {
  /** The single most important outcome this season, e.g. "maximise maize yield" */
  primary: string
  secondary?: string[]
}

export type JournalSummary = {
  /** ISO date string, e.g. "2026-06-01" */
  date: string
  /** AI-condensed version of that day's journal entry */
  summary: string
}

export type DayPlanPromptInput = {
  farmer: FarmerProfile
  conditions: FarmingConditions
  goals: FarmerGoals
  currentStage: FarmingStage
  /** Pass the 3–5 most recent journal summaries, oldest first */
  journalSummaries: JournalSummary[]
}

// Expected shape of the model's JSON response ---------------------------------

export type DayPlanTask = {
  task: string  // ≤ 30 words, starts with a verb
  note: string  // ≤ 100 words
}

export type DayPlanResponse = {
  description: string  // ≤ 300 words
  tasks: DayPlanTask[] // 3–5 items
}

// Prompt builder --------------------------------------------------------------

export function buildDayPlanPrompt(input: DayPlanPromptInput): string {
  const { farmer, conditions, goals, currentStage, journalSummaries } = input

  const animalsLine = farmer.animals?.length
    ? `Livestock: ${farmer.animals.join(", ")}.`
    : ""

  const soilLine = farmer.soilType
    ? `Soil type: ${farmer.soilType}`
    : `Soil type: not specified — infer the most common type for ${farmer.region}`

  const soilConditionLine = conditions.soilCondition
    ? `Soil condition: ${conditions.soilCondition}`
    : ""

  const waterLine = conditions.waterAvailability
    ? `Water availability: ${conditions.waterAvailability}`
    : ""

  const diseasesLine = conditions.diseasesReported?.length
    ? `Diseases/pests reported nearby: ${conditions.diseasesReported.join(", ")}`
    : ""

  const secondaryGoalsLine = goals.secondary?.length
    ? `Secondary goals: ${goals.secondary.join("; ")}`
    : ""

  const journalBlock =
    journalSummaries.length > 0
      ? journalSummaries.map((j) => `- ${j.date}: ${j.summary}`).join("\n")
      : "No journal entries yet — treat this as the farmer's first active day."

  return `
You are an expert agronomist advising smallholder farmers in East Africa.
Your audience is a practical, hands-on farmer who may have limited formal education.
Write plainly. Avoid jargon. Be specific — name the crop, tool, and exact action.

---

## Farmer Profile

Name: ${farmer.name}
Region: ${farmer.region}
${soilLine}
Crops this season: ${farmer.crops.join(", ")}
${animalsLine}

## Current Farming Stage

The farmer is in the **${currentStage}** stage of the growing cycle.

## Today's Conditions

${conditions.weatherSummary}
${soilConditionLine}
${waterLine}
${diseasesLine}

## Farmer Goals

Primary goal: ${goals.primary}
${secondaryGoalsLine}

## Recent Journal Summaries

What happened on the farm recently — what worked, what didn't, what the farmer noticed:
${journalBlock}

---

## Your Task

Generate a focused day plan for today.

Rules:
- Select the 3–5 highest-impact tasks for TODAY only — not a general to-do list.
- Every task must be grounded in the farmer's actual stage, crops, conditions, and goals.
- If the journal shows something failed or caused problems, do not repeat it.
- If the journal shows something working well, build on it.
- Account for today's weather — do not suggest field tasks during heavy rain, for example.
- Write at the level of a farmer who knows their land but is not a trained agronomist.

---

## Response Format

Respond with ONLY a valid JSON object. No markdown, no code fences, no commentary — raw JSON only.

Schema:

{
  "description": "<string>",
  "tasks": [
    {
      "task": "<string>",
      "note": "<string>"
    }
  ]
}

Constraints (strictly enforced):
- "description": ≤ 300 words. Summarise the goal for today, why these tasks matter, and how they connect to the farmer's current stage and goals.
- "task": ≤ 30 words per item. Start with an action verb. Be specific — name the crop, location, or tool.
- "note": ≤ 100 words per item. Explain how to do it and why it matters today, in plain language.
- tasks array: exactly 3 to 5 items.
- Do not add any field not listed in the schema above.
`.trim()
}
