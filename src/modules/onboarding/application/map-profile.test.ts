import { mapDraftToProfile, type OnboardingDraft } from "./map-profile"

describe("mapDraftToProfile", () => {
  const baseDraft: OnboardingDraft = {
    name: "John Kamau",
    location: "Nakuru",
    farmType: "crops",
    crops: ["crop-uuid-1"],
    livestock: [],
    workStyle: "solo",
    farmSize: "medium",
    goals: ["MAKE_MONEY"],
  }

  it("maps draft to backend-aligned profile", () => {
    const profile = mapDraftToProfile(baseDraft)
    expect(profile.name).toBe("John Kamau")
    expect(profile.productionType).toBe("CROPS")
    expect(profile.cropIds).toEqual(["crop-uuid-1"])
    expect(profile.helpersLevel).toBe("SOLO")
    expect(profile.acreage).toBe(3.5)
    expect(profile.goalSlugs).toEqual(["MAKE_MONEY"])
  })

  it("maps helpers work style to SMALL_TEAM", () => {
    const profile = mapDraftToProfile({ ...baseDraft, workStyle: "helpers" })
    expect(profile.helpersLevel).toBe("SMALL_TEAM")
  })
})
