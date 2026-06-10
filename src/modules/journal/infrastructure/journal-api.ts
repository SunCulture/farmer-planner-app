import { api } from "@/services/api"

import type { DayCompletions } from "../domain/entities/completion"
import { mapDayCompletions } from "@/modules/plan/infrastructure/api-mappers"

export interface SubmitCompletionInput {
  activityId: string
  journalText: string
  photoUris: string[]
}

export async function fetchDayCompletions(date: string): Promise<DayCompletions> {
  const dto = await api.getDayCompletions(date)
  return mapDayCompletions(dto)
}

export async function submitActivityCompletion(input: SubmitCompletionInput) {
  const formData = new FormData()
  formData.append("journalText", input.journalText)

  input.photoUris.forEach((uri, index) => {
    const filename = uri.split("/").pop() ?? `photo-${index}.jpg`
    const match = /\.(\w+)$/.exec(filename)
    const type = match ? `image/${match[1]}` : "image/jpeg"
    formData.append("photos", { uri, name: filename, type } as unknown as Blob)
  })

  return api.submitCompletion(input.activityId, formData)
}
