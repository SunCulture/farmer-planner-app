import type { FarmerProfile, ProductionType } from "../domain/entities/farmer-profile"

export interface OnboardingDraft {
  name: string
  location: string
  /** Region slug used as `location.county` in the API patch. */
  locationSlug?: string
  farmType: "crops" | "livestock" | "mixed" | null
  crops: string[]
  livestock: string[]
  workStyle: "solo" | "helpers" | null
  farmSize: "small" | "medium" | "large" | null
  goals: string[]
  twoWeekGoal?: string
}

/** Acreage estimates aligned with the onboarding farm-size step. */
const FARM_SIZE_ACREAGE: Record<NonNullable<OnboardingDraft["farmSize"]>, number> = {
  small: 0.5,
  medium: 2.5,
  large: 7.5,
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

  const profile: FarmerProfile = {
    name: draft.name,
    location: {
      label: draft.location,
      county: draft.locationSlug ?? draft.location,
      country: "Kenya",
    },
    productionType,
    cropIds: draft.crops,
    livestockIds: draft.livestock,
    helpersLevel: draft.workStyle === "solo" ? "SOLO" : "SMALL_TEAM",
    acreage: draft.farmSize ? FARM_SIZE_ACREAGE[draft.farmSize] : 1,
    goalSlugs: draft.goals,
  }

  if (draft.twoWeekGoal !== undefined) {
    profile.twoWeekGoal = draft.twoWeekGoal.trim()
  }

  return profile
}
