import type { OnboardingData } from "@/services/api"

import {
  draftFromOnboardingData,
  profileFromOnboardingData,
  uiStepFromSuggested,
} from "./resume-onboarding"

const baseData = {
  farmerId: "f1",
  name: "Ada",
  location: { label: "Kiambu", county: "kiambu", country: "Kenya" },
  productionType: "CROPS" as const,
  cropIds: ["c1"],
  livestockIds: [] as string[],
  helpersLevel: "SOLO" as const,
  acreage: 2.5,
  goalSlugs: ["MAKE_MONEY"],
  twoWeekGoal: "Sell more maize",
  onboardingCompletedAt: null as string | null,
  suggestedStep: "goals",
  steps: [],
} satisfies OnboardingData

describe("uiStepFromSuggested", () => {
  it("maps backend step keys to UI indices", () => {
    expect(uiStepFromSuggested("name")).toBe(1)
    expect(uiStepFromSuggested("location")).toBe(2)
    expect(uiStepFromSuggested("production_type")).toBe(3)
    expect(uiStepFromSuggested("crops")).toBe(4)
    expect(uiStepFromSuggested("livestock")).toBe(4)
    expect(uiStepFromSuggested("helpers")).toBe(5)
    expect(uiStepFromSuggested("acreage")).toBe(6)
    expect(uiStepFromSuggested("goals")).toBe(7)
    expect(uiStepFromSuggested("review")).toBe(8)
    expect(uiStepFromSuggested(null)).toBe(1)
  })
})

describe("draftFromOnboardingData", () => {
  it("hydrates draft fields from partial server state", () => {
    const draft = draftFromOnboardingData(baseData)
    expect(draft.name).toBe("Ada")
    expect(draft.location).toBe("Kiambu")
    expect(draft.locationSlug).toBe("kiambu")
    expect(draft.farmType).toBe("crops")
    expect(draft.crops).toEqual(["c1"])
    expect(draft.workStyle).toBe("solo")
    expect(draft.farmSize).toBe("medium")
    expect(draft.goals).toEqual(["MAKE_MONEY"])
    expect(draft.twoWeekGoal).toBe("Sell more maize")
  })
})

describe("profileFromOnboardingData", () => {
  it("maps API onboarding into FarmerProfile", () => {
    const profile = profileFromOnboardingData(baseData)
    expect(profile.name).toBe("Ada")
    expect(profile.productionType).toBe("CROPS")
    expect(profile.acreage).toBe(2.5)
  })
})
