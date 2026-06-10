import React, { useState } from "react"
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import {
  card,
  forest50,
  forest100,
  forest500,
  forest600,
  hairline,
  ink,
  ink3,
  ink4,
  radii,
  spacing,
} from "@/theme/tapp-tokens"
import { typography } from "@/theme/typography"

import { getApiErrorMessage, getValidationDetails } from "@/shared/infrastructure/api-error"

import { mapDraftToProfile } from "../application/map-profile"
import { saveFarmerProfile } from "../application/farmer-profile-store"
import { useOnboardingCatalog } from "../application/use-onboarding-catalog"
import { REGIONS } from "../infrastructure/mock-data"
import { completeOnboardingProfile, patchOnboardingProfile } from "../infrastructure/onboarding-api"

// ---------------------------------------------------------------------------
// Types (UI-local — not the same as the API entity)
// ---------------------------------------------------------------------------

type FarmTypeUI = "crops" | "livestock"
type WorkStyleUI = "solo" | "helpers"
type FarmSizeUI = "small" | "medium" | "large"

interface DraftProfile {
  name: string
  location: string
  farmType: FarmTypeUI | null
  crops: string[]
  livestock: string[]
  workStyle: WorkStyleUI | null
  farmSize: FarmSizeUI | null
  goals: string[]
}

const INITIAL_DRAFT: DraftProfile = {
  name: "",
  location: "",
  farmType: null,
  crops: [],
  livestock: [],
  workStyle: null,
  farmSize: null,
  goals: [],
}

const FARM_SIZE_ACREAGE: Record<FarmSizeUI, number> = {
  small: 0.5,
  medium: 2.5,
  large: 7.5,
}

// Steps: 0=welcome  1=name  2=location  3=farmType  4=species  5=helpers  6=farmSize  7=goals  8=success
const PROGRESS_STEPS = 7

const W = Dimensions.get("window").width
const GRID_CARD_W = (W - spacing.s5 * 2 - spacing.s3) / 2

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function OnboardingScreen() {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<DraftProfile>(INITIAL_DRAFT)
  const [locationQuery, setLocationQuery] = useState("")
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const goNext = () => setStep((s) => s + 1)
  const goBack = () => setStep((s) => Math.max(0, s - 1))
  const skipToDashboard = () => router.replace("/(tabs)/" as any)

  const [finishError, setFinishError] = useState<string | null>(null)
  const [isFinishing, setIsFinishing] = useState(false)
  const { crops: catalogCrops, livestock: catalogLivestock, goals: catalogGoals, isLoading: catalogLoading } =
    useOnboardingCatalog()

  const handleFinish = async () => {
    setFinishError(null)
    setIsFinishing(true)
    const profile = mapDraftToProfile(draft)
    try {
      saveFarmerProfile(profile)
      await patchOnboardingProfile(profile)
      await completeOnboardingProfile()
      setStep(8)
    } catch (err) {
      const details = getValidationDetails(err)
      setFinishError(
        details.length > 0 ? details.join("\n") : getApiErrorMessage(err),
      )
    } finally {
      setIsFinishing(false)
    }
  }

  const ctaEnabled =
    step === 0 ||
    (step === 1 && draft.name.trim().length >= 2) ||
    (step === 2 && draft.location !== "") ||
    (step === 3 && draft.farmType !== null) ||
    (step === 4 &&
      (draft.farmType === "crops" ? draft.crops.length > 0 : draft.livestock.length > 0)) ||
    (step === 5 && draft.workStyle !== null) ||
    (step === 6 && draft.farmSize !== null) ||
    (step === 7 && draft.goals.length > 0)

  const ctaLabel =
    step === 0 ? "Start My Farm Plan  →" : step === 7 ? "Build My Farm Plan 🌱" : "Continue  →"

  const ctaOnPress = step === 7 ? handleFinish : goNext

  const isWelcome = step === 0
  const isSuccess = step === 8
  const showHeader = !isWelcome && !isSuccess

  const filteredRegions = locationQuery
    ? REGIONS.filter((r) => r.name.toLowerCase().includes(locationQuery.toLowerCase()))
    : REGIONS

  // ---- Success screen -------------------------------------------------------

  if (isSuccess) {
    const farmTypeLabel = draft.farmType === "crops" ? "Crops" : "Livestock"
    const farmTypeEmoji = draft.farmType === "crops" ? "🌱" : "🐄"
    const farmSizeLabel =
      draft.farmSize === "small"
        ? "Small farm"
        : draft.farmSize === "medium"
          ? "Medium farm"
          : "Large farm"
    const farmSizeEmoji =
      draft.farmSize === "small" ? "🌿" : draft.farmSize === "medium" ? "🌾" : "🌳"

    return (
      <View style={[$root, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.s4 }]}>
        <View style={$successCenter}>
          <View style={$trophyCircle}>
            <Text style={$trophyEmoji}>🏆</Text>
          </View>
          <Text style={$successHeading}>{"Your smart farming\njourney begins now! 🌱"}</Text>
          <Text style={$successSubtitle}>
            {"Welcome, "}
            {draft.name}
            {"! Your plan is ready.\nLet's make this season your best."}
          </Text>
          <View style={$tagRow}>
            {draft.location ? (
              <View style={$tag}>
                <Text style={$tagText}>📍 {draft.location}</Text>
              </View>
            ) : null}
            <View style={$tag}>
              <Text style={$tagText}>
                {farmTypeEmoji} {farmTypeLabel}
              </Text>
            </View>
            {draft.farmSize ? (
              <View style={$tag}>
                <Text style={$tagText}>
                  {farmSizeEmoji} {farmSizeLabel}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          style={[$ctaBtn, { marginHorizontal: spacing.s5 }]}
          onPress={() => router.replace("/(tabs)/" as any)}
          activeOpacity={0.85}
        >
          <Text style={$ctaBtnText}>Go to My Dashboard →</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ---- Main flow (steps 0-7) ------------------------------------------------

  return (
    <View style={$root}>
      {/* Header with progress bar */}
      {showHeader && (
        <View style={[$header, { paddingTop: insets.top + spacing.s3 }]}>
          <TouchableOpacity onPress={goBack} hitSlop={8} style={$backBtn}>
            <Ionicons name="chevron-back" size={24} color={ink} />
          </TouchableOpacity>
          <View style={$progressBar}>
            {Array.from({ length: PROGRESS_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  $progressSeg,
                  { marginLeft: i > 0 ? 4 : 0 },
                  i < step ? $progressFilled : $progressEmpty,
                ]}
              />
            ))}
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            $scrollContent,
            isWelcome && $scrollWelcome,
            !isWelcome && { paddingTop: spacing.s6 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ---- Welcome ---- */}
          {step === 0 && (
            <>
              <View style={$welcomeBadge}>
                <Text style={$welcomeBadgeText}>✦ Tujiweze</Text>
              </View>
              <View style={$heroContainer}>
                <Text style={$heroEmoji}>🧑‍🌾</Text>
              </View>
              <View style={$welcomeTextBlock}>
                <Text style={$welcomeHeading}>{"Let's grow smarter\ntogether 🌱"}</Text>
                <Text style={$welcomeSubtitle}>
                  {"AI-powered farming plans,\npersonalised for African farmers."}
                </Text>
              </View>
            </>
          )}

          {/* ---- Name ---- */}
          {step === 1 && (
            <>
              <Text style={$stepEmoji}>👋</Text>
              <Text style={$stepHeading}>{"What should we\ncall you?"}</Text>
              <Text style={$stepSubtitle}>{"We'll personalise your experience just for you."}</Text>
              <TextInput
                style={$nameInput}
                value={draft.name}
                onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
                placeholder="Your name"
                placeholderTextColor={ink4}
                autoFocus
                returnKeyType="done"
              />
              {draft.name.trim().length >= 2 && (
                <View style={$nameConfirm}>
                  <Text style={$nameConfirmText}>✓ Great to meet you, {draft.name.trim()}!</Text>
                </View>
              )}
            </>
          )}

          {/* ---- Location ---- */}
          {step === 2 && (
            <>
              <Text style={$stepHeading}>{"Where's your farm?"}</Text>
              <Text style={$stepSubtitle}>{"We'll show local weather and soil advice."}</Text>
              <View style={$searchBar}>
                <Ionicons name="search-outline" size={16} color={ink3} style={{ marginRight: 8 }} />
                <TextInput
                  style={$searchInput}
                  value={locationQuery}
                  onChangeText={setLocationQuery}
                  placeholder="Search county or region..."
                  placeholderTextColor={ink4}
                />
              </View>
              <View style={$grid}>
                {filteredRegions.map((region) => {
                  const selected = draft.location === region.name
                  return (
                    <Pressable
                      key={region.id}
                      style={[$locationCard, selected && $locationCardSelected]}
                      onPress={() => setDraft((d) => ({ ...d, location: region.name }))}
                    >
                      <Text style={{ fontSize: 22 }}>{region.emoji}</Text>
                      <Text style={[$locationName, selected && { color: forest500 }]}>
                        {region.name}
                      </Text>
                      <Text style={$locationTemp}>{region.temp}</Text>
                      {selected && (
                        <View style={$locationCheck}>
                          <Ionicons name="checkmark-circle" size={18} color={forest500} />
                        </View>
                      )}
                    </Pressable>
                  )
                })}
              </View>
            </>
          )}

          {/* ---- Farm type ---- */}
          {step === 3 && (
            <>
              <Text style={$stepHeading}>{"What do you farm?"}</Text>
              <Text style={$stepSubtitle}>{"Choose your primary farming type."}</Text>
              {(
                [
                  {
                    id: "crops" as FarmTypeUI,
                    label: "Crops",
                    desc: "Fruits, vegetables & grains",
                    illustration: "🌳🌽🍅",
                    illustrationBg: forest50,
                    icon: "🌱",
                  },
                  {
                    id: "livestock" as FarmTypeUI,
                    label: "Livestock",
                    desc: "Cows, goats, chickens & more",
                    illustration: "🐄🐔🐐",
                    illustrationBg: "#FDF3E7",
                    icon: "🐄",
                  },
                ] as const
              ).map((opt) => {
                const selected = draft.farmType === opt.id
                return (
                  <Pressable
                    key={opt.id}
                    style={[$bigCard, selected && $bigCardSelected]}
                    onPress={() =>
                      setDraft((d) => ({ ...d, farmType: opt.id, crops: [], livestock: [] }))
                    }
                  >
                    <View style={[$bigCardIllustration, { backgroundColor: opt.illustrationBg }]}>
                      <Text style={{ fontSize: 44 }}>{opt.illustration}</Text>
                    </View>
                    <View style={$bigCardFooter}>
                      <View style={{ flex: 1 }}>
                        <Text style={[$bigCardLabel, selected && { color: forest500 }]}>
                          {opt.icon} {opt.label}
                        </Text>
                        <Text style={$bigCardDesc}>{opt.desc}</Text>
                      </View>
                      <View style={[$radio, selected && $radioSelected]}>
                        {selected && <View style={$radioDot} />}
                      </View>
                    </View>
                  </Pressable>
                )
              })}
            </>
          )}

          {/* ---- Crops ---- */}
          {step === 4 && draft.farmType === "crops" && (
            <>
              <Text style={$stepHeading}>{"What crops do\nyou grow?"}</Text>
              <Text style={$stepSubtitle}>{"Select all that apply."}</Text>
              <View style={$grid}>
                {catalogLoading ? (
                  <ActivityIndicator color={forest500} style={{ marginTop: spacing.s4 }} />
                ) : null}
                {catalogCrops.map((crop) => {
                  const selected = draft.crops.includes(crop.id)
                  return (
                    <Pressable
                      key={crop.id}
                      style={[$speciesCard, selected && $speciesCardSelected]}
                      onPress={() =>
                        setDraft((d) => ({
                          ...d,
                          crops: d.crops.includes(crop.id)
                            ? d.crops.filter((c) => c !== crop.id)
                            : [...d.crops, crop.id],
                        }))
                      }
                    >
                      <Text style={{ fontSize: 30, marginBottom: spacing.s2 }}>{crop.emoji}</Text>
                      <Text style={[$speciesLabel, selected && { color: forest500 }]}>
                        {crop.name}
                      </Text>
                      <View style={[$checkBadge, selected ? $checkBadgeFilled : $checkBadgeEmpty]}>
                        {selected && <Ionicons name="checkmark" size={10} color={card} />}
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            </>
          )}

          {/* ---- Livestock ---- */}
          {step === 4 && draft.farmType !== "crops" && (
            <>
              <Text style={$stepHeading}>{"What livestock do\nyou raise?"}</Text>
              <Text style={$stepSubtitle}>{"Select all that apply."}</Text>
              <View style={$grid}>
                {catalogLoading ? (
                  <ActivityIndicator color={forest500} style={{ marginTop: spacing.s4 }} />
                ) : null}
                {catalogLivestock.map((animal) => {
                  const selected = draft.livestock.includes(animal.id)
                  return (
                    <Pressable
                      key={animal.id}
                      style={[$speciesCard, selected && $speciesCardSelected]}
                      onPress={() =>
                        setDraft((d) => ({
                          ...d,
                          livestock: d.livestock.includes(animal.id)
                            ? d.livestock.filter((a) => a !== animal.id)
                            : [...d.livestock, animal.id],
                        }))
                      }
                    >
                      <Text style={{ fontSize: 30, marginBottom: spacing.s2 }}>{animal.emoji}</Text>
                      <Text style={[$speciesLabel, selected && { color: forest500 }]}>
                        {animal.name}
                      </Text>
                      <View style={[$checkBadge, selected ? $checkBadgeFilled : $checkBadgeEmpty]}>
                        {selected && <Ionicons name="checkmark" size={10} color={card} />}
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            </>
          )}

          {/* ---- Helpers ---- */}
          {step === 5 && (
            <>
              <Text style={$stepHeading}>{"Do you work alone\nor with helpers?"}</Text>
              <Text style={$stepSubtitle}>
                {"We'll plan the right workload for your situation."}
              </Text>
              {(
                [
                  {
                    id: "solo" as WorkStyleUI,
                    label: "Solo Farmer",
                    desc: "I work my farm on my own",
                    illustration: "🧑‍🌾",
                    icon: "👤",
                  },
                  {
                    id: "helpers" as WorkStyleUI,
                    label: "With Helpers",
                    desc: "I have farmhands or family help",
                    illustration: "👨‍👩‍👧",
                    icon: "👥",
                  },
                ] as const
              ).map((opt) => {
                const selected = draft.workStyle === opt.id
                return (
                  <Pressable
                    key={opt.id}
                    style={[$bigCard, selected && $bigCardSelected]}
                    onPress={() => setDraft((d) => ({ ...d, workStyle: opt.id }))}
                  >
                    <View style={[$bigCardIllustration, { backgroundColor: "#F5F5F2" }]}>
                      <Text style={{ fontSize: 56 }}>{opt.illustration}</Text>
                    </View>
                    <View style={$bigCardFooter}>
                      <View style={{ flex: 1 }}>
                        <Text style={[$bigCardLabel, selected && { color: forest500 }]}>
                          {opt.icon} {opt.label}
                        </Text>
                        <Text style={$bigCardDesc}>{opt.desc}</Text>
                      </View>
                      <View style={[$radio, selected && $radioSelected]}>
                        {selected && <View style={$radioDot} />}
                      </View>
                    </View>
                  </Pressable>
                )
              })}
            </>
          )}

          {/* ---- Farm size ---- */}
          {step === 6 && (
            <>
              <Text style={$stepHeading}>{"How large is\nyour farm?"}</Text>
              <Text style={$stepSubtitle}>{"Helps us tailor your schedule and task load."}</Text>
              {(
                [
                  {
                    id: "small" as FarmSizeUI,
                    label: "Small Farm",
                    desc: "Under 1 acre",
                    emoji: "🌿🌿",
                    icon: "🌱",
                  },
                  {
                    id: "medium" as FarmSizeUI,
                    label: "Medium Farm",
                    desc: "1 to 5 acres",
                    emoji: "🌾🌾🌾",
                    icon: "🌿",
                  },
                  {
                    id: "large" as FarmSizeUI,
                    label: "Large Farm",
                    desc: "Over 5 acres",
                    emoji: "🌳🌳🌳🌳",
                    icon: "🍃",
                  },
                ] as const
              ).map((opt) => {
                const selected = draft.farmSize === opt.id
                return (
                  <Pressable
                    key={opt.id}
                    style={[$sizeCard, selected && $sizeCardSelected]}
                    onPress={() => setDraft((d) => ({ ...d, farmSize: opt.id }))}
                  >
                    <Text style={{ fontSize: 32, marginRight: spacing.s4 }}>{opt.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[$sizeLabel, selected && { color: forest500 }]}>
                        {opt.icon} {opt.label}
                      </Text>
                      <Text style={$sizeDesc}>{opt.desc}</Text>
                    </View>
                    <View style={[$radio, selected && $radioSelected]}>
                      {selected && <View style={$radioDot} />}
                    </View>
                  </Pressable>
                )
              })}
            </>
          )}

          {/* ---- Goals ---- */}
          {step === 7 && (
            <>
              <Text style={$stepHeading}>{"What's your\nbiggest goal?"}</Text>
              <Text style={$stepSubtitle}>{"We'll build your plan around what matters most."}</Text>
              <View style={$grid}>
                {catalogLoading ? (
                  <ActivityIndicator color={forest500} style={{ marginTop: spacing.s4 }} />
                ) : null}
                {catalogGoals.map((goal) => {
                  const selected = draft.goals.includes(goal.id)
                  return (
                    <Pressable
                      key={goal.id}
                      style={[$goalCard, selected && $goalCardSelected]}
                      onPress={() =>
                        setDraft((d) => ({
                          ...d,
                          goals: d.goals.includes(goal.id)
                            ? d.goals.filter((g) => g !== goal.id)
                            : [...d.goals, goal.id],
                        }))
                      }
                    >
                      <Text style={{ fontSize: 30, marginBottom: spacing.s2 }}>{goal.emoji}</Text>
                      <Text style={[$goalLabel, selected && { color: forest500 }]}>
                        {goal.name}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={[$footer, { paddingBottom: insets.bottom + spacing.s2 }]}>
        <TouchableOpacity
          style={[$ctaBtn, !ctaEnabled && $ctaBtnDisabled]}
          onPress={ctaOnPress}
          disabled={!ctaEnabled}
          activeOpacity={0.85}
        >
          <Text style={$ctaBtnText}>{ctaLabel}</Text>
        </TouchableOpacity>
        {isWelcome && <Text style={$featureLine}>Free · Works offline · No complex forms</Text>}
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const $root: ViewStyle = {
  flex: 1,
  backgroundColor: card,
}

const $header: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.s5,
  paddingBottom: spacing.s4,
}

const $backBtn: ViewStyle = {
  width: 36,
  height: 36,
  alignItems: "center",
  justifyContent: "center",
}

const $progressBar: ViewStyle = {
  flex: 1,
  flexDirection: "row",
  marginLeft: spacing.s3,
}

const $progressSeg: ViewStyle = {
  flex: 1,
  height: 4,
  borderRadius: radii.pill,
}

const $progressFilled: ViewStyle = { backgroundColor: forest500 }
const $progressEmpty: ViewStyle = { backgroundColor: hairline }

const $scrollContent: ViewStyle = {
  paddingHorizontal: spacing.s5,
  paddingBottom: spacing.s6,
}

const $scrollWelcome: ViewStyle = {
  flexGrow: 1,
  paddingTop: spacing.s8,
  alignItems: "center",
}

// Welcome
const $welcomeBadge: ViewStyle = {
  backgroundColor: forest500,
  paddingHorizontal: spacing.s4,
  paddingVertical: 6,
  borderRadius: radii.pill,
  marginBottom: spacing.s4,
}

const $welcomeBadgeText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: "#FFFFFF",
  letterSpacing: 0.3,
}

const $heroContainer: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
}

const $heroEmoji: TextStyle = {
  fontSize: 96,
  lineHeight: 112,
  textAlign: "center",
}

const $welcomeTextBlock: ViewStyle = {
  alignItems: "center",
  width: "100%",
  paddingBottom: spacing.s2,
}

const $welcomeHeading: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 30,
  color: ink,
  textAlign: "center",
  lineHeight: 38,
  marginBottom: spacing.s3,
}

const $welcomeSubtitle: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 15,
  color: ink3,
  textAlign: "center",
  lineHeight: 22,
}

// Step headings
const $stepEmoji: TextStyle = {
  fontSize: 40,
  marginBottom: spacing.s4,
}

const $stepHeading: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 26,
  color: ink,
  lineHeight: 34,
  marginBottom: spacing.s2,
}

const $stepSubtitle: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink3,
  marginBottom: spacing.s5,
  lineHeight: 20,
}

// Name step
const $nameInput: TextStyle = {
  height: 52,
  borderWidth: 1.5,
  borderColor: hairline,
  borderRadius: radii.xl,
  paddingHorizontal: spacing.s4,
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: ink,
  backgroundColor: card,
  marginBottom: spacing.s3,
}

const $nameConfirm: ViewStyle = {
  backgroundColor: forest50,
  borderRadius: radii.lg,
  paddingVertical: spacing.s3,
  paddingHorizontal: spacing.s4,
}

const $nameConfirmText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: forest500,
}

// Location step
const $searchBar: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1.5,
  borderColor: hairline,
  borderRadius: radii.xl,
  paddingHorizontal: spacing.s4,
  height: 44,
  backgroundColor: card,
  marginBottom: spacing.s4,
}

const $searchInput: TextStyle = {
  flex: 1,
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink,
  paddingVertical: 0,
}

// 2-column grid
const $grid: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.s3,
}

const $locationCard: ViewStyle = {
  width: GRID_CARD_W,
  backgroundColor: card,
  borderRadius: radii.lg,
  borderWidth: 1.5,
  borderColor: hairline,
  padding: spacing.s3,
  position: "relative",
}

const $locationCardSelected: ViewStyle = {
  backgroundColor: forest50,
  borderColor: forest500,
}

const $locationName: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: ink,
  marginTop: spacing.s1,
}

const $locationTemp: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: ink3,
  marginTop: 2,
}

const $locationCheck: ViewStyle = {
  position: "absolute",
  top: spacing.s2,
  right: spacing.s2,
}

// Big cards (farm type, helpers)
const $bigCard: ViewStyle = {
  backgroundColor: card,
  borderRadius: radii.xl,
  borderWidth: 1.5,
  borderColor: hairline,
  marginBottom: spacing.s4,
  overflow: "hidden",
}

const $bigCardSelected: ViewStyle = {
  borderColor: forest500,
}

const $bigCardIllustration: ViewStyle = {
  height: 110,
  alignItems: "center",
  justifyContent: "center",
}

const $bigCardFooter: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.s4,
  paddingVertical: spacing.s4,
}

const $bigCardLabel: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 15,
  color: ink,
  marginBottom: 2,
}

const $bigCardDesc: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink3,
}

// Radio
const $radio: ViewStyle = {
  width: 22,
  height: 22,
  borderRadius: 11,
  borderWidth: 2,
  borderColor: hairline,
  alignItems: "center",
  justifyContent: "center",
}

const $radioSelected: ViewStyle = {
  borderColor: forest500,
}

const $radioDot: ViewStyle = {
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: forest500,
}

// Species / goals cards (2-col grid)
const $speciesCard: ViewStyle = {
  width: GRID_CARD_W,
  backgroundColor: card,
  borderRadius: radii.lg,
  borderWidth: 1.5,
  borderColor: hairline,
  padding: spacing.s4,
  alignItems: "center",
  position: "relative",
}

const $speciesCardSelected: ViewStyle = {
  backgroundColor: forest50,
  borderColor: forest500,
}

const $speciesLabel: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: ink,
  textAlign: "center",
}

const $checkBadge: ViewStyle = {
  position: "absolute",
  top: spacing.s2,
  right: spacing.s2,
  width: 18,
  height: 18,
  borderRadius: 9,
  alignItems: "center",
  justifyContent: "center",
}

const $checkBadgeEmpty: ViewStyle = {
  borderWidth: 1.5,
  borderColor: hairline,
}

const $checkBadgeFilled: ViewStyle = {
  backgroundColor: forest500,
}

// Farm size cards
const $sizeCard: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: card,
  borderRadius: radii.xl,
  borderWidth: 1.5,
  borderColor: hairline,
  padding: spacing.s4,
  marginBottom: spacing.s3,
}

const $sizeCardSelected: ViewStyle = {
  backgroundColor: forest50,
  borderColor: forest500,
}

const $sizeLabel: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 15,
  color: ink,
  marginBottom: 2,
}

const $sizeDesc: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink3,
}

// Goal cards
const $goalCard: ViewStyle = {
  width: GRID_CARD_W,
  backgroundColor: card,
  borderRadius: radii.lg,
  borderWidth: 1.5,
  borderColor: hairline,
  padding: spacing.s4,
  alignItems: "center",
}

const $goalCardSelected: ViewStyle = {
  backgroundColor: forest50,
  borderColor: forest500,
}

const $goalLabel: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: ink,
  textAlign: "center",
}

// Footer
const $footer: ViewStyle = {
  paddingHorizontal: spacing.s5,
  paddingTop: spacing.s3,
  gap: spacing.s1,
}

const $featureLine: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: ink3,
  textAlign: "center",
  marginBottom: spacing.s2,
}

const $ctaBtn: ViewStyle = {
  backgroundColor: forest500,
  borderRadius: radii.pill,
  height: 52,
  alignItems: "center",
  justifyContent: "center",
}

const $ctaBtnDisabled: ViewStyle = {
  backgroundColor: hairline,
}

const $ctaBtnText: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: "#FFFFFF",
  letterSpacing: 0.2,
}

const $skipBtn: ViewStyle = {
  alignItems: "center",
  paddingVertical: spacing.s3,
}

const $skipText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink3,
}

// Success screen
const $successCenter: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: spacing.s5,
}

const $trophyCircle: ViewStyle = {
  width: 120,
  height: 120,
  borderRadius: 60,
  backgroundColor: forest50,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: spacing.s6,
}

const $trophyEmoji: TextStyle = {
  fontSize: 56,
}

const $successHeading: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 26,
  color: ink,
  textAlign: "center",
  lineHeight: 34,
  marginBottom: spacing.s3,
}

const $successSubtitle: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 15,
  color: ink3,
  textAlign: "center",
  lineHeight: 22,
  marginBottom: spacing.s6,
}

const $tagRow: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.s2,
  justifyContent: "center",
}

const $tag: ViewStyle = {
  backgroundColor: forest50,
  borderRadius: radii.pill,
  paddingHorizontal: spacing.s3,
  paddingVertical: 6,
}

const $tagText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: forest500,
}
