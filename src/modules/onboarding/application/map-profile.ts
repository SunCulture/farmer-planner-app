import type { FarmerProfile, ProductionType } from "../domain/entities/farmer-profile"

export interface OnboardingDraft {
  name: string
  location: string
  farmType: "crops" | "livestock" | "mixed" | null
  crops: string[]
  livestock: string[]
  workStyle: "solo" | "helpers" | null
  farmSize: "small" | "medium" | "large" | null
  goals: string[]
}

const FARM_SIZE_ACREAGE: Record<NonNullable<OnboardingDraft["farmSize"]>, number> = {
  small: 1,
  medium: 3.5,
  large: 10,
}

export function mapDraftToProfile(draft: OnboardingDraft): FarmerProfile {
  const productionType: ProductionType =
    draft.farmType === "crops"
      ? "CROPS"
      : draft.farmType === "livestock"
        ? "LIVESTOCK"
        : draft.farmType === "mixed"
          ? "MIXED"
          : "CROPS"

  return {
    name: draft.name,
    location: { label: draft.location, county: draft.location, country: "Kenya" },
    productionType,
    cropIds: draft.crops,
    livestockIds: draft.livestock,
    helpersLevel: draft.workStyle === "solo" ? "SOLO" : "SMALL_TEAM",
    acreage: draft.farmSize ? FARM_SIZE_ACREAGE[draft.farmSize] : 1,
    goalSlugs: draft.goals,
  }
}
