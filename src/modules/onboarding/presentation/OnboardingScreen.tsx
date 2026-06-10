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

import { api } from "@/services/api"

import { saveAuthToken, saveFarmerProfile } from "../application/farmer-profile-store"
import { useCrops, useGoals, useLivestock, useRegions } from "../application/use-catalog-queries"

// Display-only emoji lookups — purely cosmetic, not data
const CROP_EMOJI: Record<string, string> = {
  maize: "🌽", beans: "🫘", tomatoes: "🍅", kale: "🥬", potatoes: "🥔",
  onions: "🧅", capsicum: "🫑", watermelon: "🍉", avocado: "🥑", mango: "🥭",
  banana: "🍌", coffee: "☕", tea: "🍵",
}
const LIVESTOCK_EMOJI: Record<string, string> = {
  cattle: "🐄", chickens: "🐔", goats: "🐐", sheep: "🐑", pigs: "🐷",
  rabbits: "🐰", ducks: "🦆", bees: "🐝",
}
const GOAL_EMOJI: Record<string, string> = {
  MAKE_MONEY: "💰", FOOD_SECURITY: "🌽", SAVE_TIME: "⏰",
  REDUCE_LOSSES: "📉", LIVESTOCK_HEALTH: "🐄", MODERN_FARMING: "📚",
}
const REGION_EMOJI: Record<string, string> = {
  nairobi: "🏙️", nakuru: "🌽", kisumu: "🌊", mombasa: "☀️", eldoret: "🥬",
  kitale: "🌽", machakos: "⛰️", nyeri: "🍃", meru: "🌱", thika: "🍍",
  kisii: "🫐", kakamega: "🌧️", garissa: "🌵", narok: "🦁",
}

// ---------------------------------------------------------------------------
// Types (UI-local — not the same as the API entity)
// ---------------------------------------------------------------------------

type FarmTypeUI = "crops" | "livestock"
type WorkStyleUI = "solo" | "helpers"
type FarmSizeUI = "small" | "medium" | "large"

interface DraftProfile {
  name: string
  location: string      // region name — display label
  locationSlug: string  // region slug — used as county in API patch
  farmType: FarmTypeUI | null
  crops: string[]
  livestock: string[]
  workStyle: WorkStyleUI | null
  farmSize: FarmSizeUI | null
  goals: string[]       // goal slugs (e.g. "MAKE_MONEY")
}

const INITIAL_DRAFT: DraftProfile = {
  name: "",
  location: "",
  locationSlug: "",
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

// Steps: 0=auth(login/register)  1=name  2=location  3=farmType  4=species  5=helpers  6=farmSize  7=goals  8=success
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

  // Auth step state
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authName, setAuthName] = useState("")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Finish step state
  const [finishLoading, setFinishLoading] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)

  const router = useRouter()
  const insets = useSafeAreaInsets()

  const cropsQuery = useCrops()
  const livestockQuery = useLivestock()
  const regionsQuery = useRegions()
  const goalsQuery = useGoals()

  const goNext = () => setStep((s) => s + 1)
  const goBack = () => setStep((s) => Math.max(0, s - 1))

  const handleAuth = async () => {
    setAuthError(null)
    setAuthLoading(true)
    try {
      let res
      if (authMode === "login") {
        res = await api.login({ email: authEmail.trim(), password: authPassword })
      } else {
        res = await api.register({ email: authEmail.trim(), password: authPassword, name: authName.trim() })
      }

      console.log("[auth] status:", res.status, "ok:", res.ok, "data:", JSON.stringify(res.data))

      if (!res.ok || !res.data?.data?.accessToken) {
        const msg =
          (res.data as any)?.error?.message ??
          (res.originalError?.message ?? `Request failed (${res.status ?? "no response"})`)
        setAuthError(msg)
        return
      }

      const { accessToken, farmer } = res.data.data
      saveAuthToken(accessToken)
      api.setAuthToken(accessToken)

      if (farmer.displayName) {
        setDraft((d) => ({ ...d, name: farmer.displayName }))
      }

      if (authMode === "login") {
        router.replace("/(tabs)/" as any)
      } else {
        setStep(1)
      }
    } finally {
      setAuthLoading(false)
    }
  }

  const handleFinish = async () => {
    setFinishError(null)
    setFinishLoading(true)
    try {
      const profile = {
        name: draft.name,
        location: { label: draft.location, county: draft.locationSlug, country: "Kenya" },
        productionType: (draft.farmType === "crops"
          ? "CROPS"
          : "LIVESTOCK") as import("../domain/entities/farmer-profile").ProductionType,
        cropIds: draft.crops,
        livestockIds: draft.livestock,
        helpersLevel: (draft.workStyle === "solo"
          ? "SOLO"
          : "WITH_HELPERS") as import("../domain/entities/farmer-profile").HelpersLevel,
        acreage: FARM_SIZE_ACREAGE[draft.farmSize!],
        goalSlugs: draft.goals,
      }
      saveFarmerProfile(profile)

      const patchRes = await api.patchOnboarding(profile)
      if (!patchRes.ok) {
        const msg =
          (patchRes.data as any)?.error?.message ??
          patchRes.originalError?.message ??
          `Save failed (${patchRes.status ?? "no response"})`
        setFinishError(msg)
        return
      }

      const completeRes = await api.completeOnboarding()
      if (!completeRes.ok) {
        const msg =
          (completeRes.data as any)?.error?.message ??
          completeRes.originalError?.message ??
          `Could not complete onboarding (${completeRes.status ?? "no response"})`
        setFinishError(msg)
        return
      }

      setStep(8)
    } finally {
      setFinishLoading(false)
    }
  }

  const authCtaEnabled =
    authEmail.trim().includes("@") &&
    authPassword.length >= 6 &&
    (authMode === "login" || authName.trim().length >= 2) &&
    !authLoading

  const ctaEnabled =
    (step === 1 && draft.name.trim().length >= 2) ||
    (step === 2 && draft.location !== "") ||
    (step === 3 && draft.farmType !== null) ||
    (step === 4 &&
      (draft.farmType === "crops" ? draft.crops.length > 0 : draft.livestock.length > 0)) ||
    (step === 5 && draft.workStyle !== null) ||
    (step === 6 && draft.farmSize !== null) ||
    (step === 7 && draft.goals.length > 0)

  const ctaLabel = step === 7 ? "Build My Farm Plan 🌱" : "Continue  →"
  const ctaOnPress = step === 7 ? handleFinish : goNext

  const isAuth = step === 0
  const isSuccess = step === 8
  const showHeader = !isAuth && !isSuccess

  const allRegions = regionsQuery.data ?? []
  const filteredRegions = locationQuery
    ? allRegions.filter((r) => r.name.toLowerCase().includes(locationQuery.toLowerCase()))
    : allRegions

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

  // ---- Auth screen (step 0) — rendered separately, no scroll wrapper --------

  if (isAuth) {
    return (
      <KeyboardAvoidingView
        style={[$root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={$authScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand badge */}
          <View style={$authBadge}>
            <Text style={$authBadgeText}>✦ Tujiweze</Text>
          </View>

          <Text style={$authHeading}>
            {authMode === "login" ? "Welcome back 👋" : "Create your account 🌱"}
          </Text>
          <Text style={$authSubtitle}>
            {authMode === "login"
              ? "Sign in to continue your farming journey."
              : "Enter your email to get started."}
          </Text>

          {/* Name — register only */}
          {authMode === "register" && (
            <>
              <Text style={$fieldLabel}>Full name</Text>
              <TextInput
                style={$authInput}
                value={authName}
                onChangeText={(v) => { setAuthName(v); setAuthError(null) }}
                placeholder="John Kamau"
                placeholderTextColor={ink4}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </>
          )}

          {/* Email */}
          <Text style={$fieldLabel}>Email</Text>
          <TextInput
            style={$authInput}
            value={authEmail}
            onChangeText={(v) => { setAuthEmail(v); setAuthError(null) }}
            placeholder="you@example.com"
            placeholderTextColor={ink4}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Password */}
          <Text style={$fieldLabel}>Password</Text>
          <TextInput
            style={$authInput}
            value={authPassword}
            onChangeText={(v) => { setAuthPassword(v); setAuthError(null) }}
            placeholder="••••••••"
            placeholderTextColor={ink4}
            secureTextEntry
          />

          {/* Error */}
          {authError ? <Text style={$authErrorText}>{authError}</Text> : null}

          {/* Primary CTA */}
          <TouchableOpacity
            style={[$ctaBtn, !authCtaEnabled && $ctaBtnDisabled, { marginTop: spacing.s4 }]}
            onPress={handleAuth}
            disabled={!authCtaEnabled}
            activeOpacity={0.85}
          >
            {authLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={$ctaBtnText}>
                {authMode === "login" ? "Sign in  →" : "Create account  →"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Mode toggle */}
          <TouchableOpacity
            style={$authToggle}
            onPress={() => {
              setAuthMode((m) => (m === "login" ? "register" : "login"))
              setAuthName("")
              setAuthError(null)
            }}
          >
            <Text style={$authToggleText}>
              {authMode === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
              <Text style={$authToggleLink}>
                {authMode === "login" ? "Register" : "Sign in"}
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

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
          contentContainerStyle={[$scrollContent, { paddingTop: spacing.s6 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

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
              {regionsQuery.isLoading ? (
                <ActivityIndicator color={forest500} style={{ marginTop: spacing.s6 }} />
              ) : (
                <View style={$grid}>
                  {filteredRegions.map((region) => {
                    const selected = draft.location === region.name
                    const emoji = REGION_EMOJI[region.slug] ?? "📍"
                    const tempLabel = region.weather ? `${region.weather.temperature}°C` : null
                    return (
                      <Pressable
                        key={region.id}
                        style={[$locationCard, selected && $locationCardSelected]}
                        onPress={() =>
                          setDraft((d) => ({
                            ...d,
                            location: region.name,
                            locationSlug: region.slug,
                          }))
                        }
                      >
                        <Text style={{ fontSize: 22 }}>{emoji}</Text>
                        <Text style={[$locationName, selected && { color: forest500 }]}>
                          {region.name}
                        </Text>
                        {tempLabel && <Text style={$locationTemp}>{tempLabel}</Text>}
                        {region.weather && (
                          <Text style={$locationWeatherDesc} numberOfLines={1}>
                            {region.weather.description}
                          </Text>
                        )}
                        {selected && (
                          <View style={$locationCheck}>
                            <Ionicons name="checkmark-circle" size={18} color={forest500} />
                          </View>
                        )}
                      </Pressable>
                    )
                  })}
                </View>
              )}
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
              {cropsQuery.isLoading ? (
                <ActivityIndicator color={forest500} style={{ marginTop: spacing.s6 }} />
              ) : (
                <View style={$grid}>
                  {(cropsQuery.data ?? []).map((crop) => {
                    const selected = draft.crops.includes(crop.id)
                    const emoji = CROP_EMOJI[crop.slug] ?? "🌱"
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
                        <Text style={{ fontSize: 30, marginBottom: spacing.s2 }}>{emoji}</Text>
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
              )}
            </>
          )}

          {/* ---- Livestock ---- */}
          {step === 4 && draft.farmType !== "crops" && (
            <>
              <Text style={$stepHeading}>{"What livestock do\nyou raise?"}</Text>
              <Text style={$stepSubtitle}>{"Select all that apply."}</Text>
              {livestockQuery.isLoading ? (
                <ActivityIndicator color={forest500} style={{ marginTop: spacing.s6 }} />
              ) : (
                <View style={$grid}>
                  {(livestockQuery.data ?? []).map((animal) => {
                    const selected = draft.livestock.includes(animal.id)
                    const emoji = LIVESTOCK_EMOJI[animal.slug] ?? "🐾"
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
                        <Text style={{ fontSize: 30, marginBottom: spacing.s2 }}>{emoji}</Text>
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
              )}
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
              {goalsQuery.isLoading ? (
                <ActivityIndicator color={forest500} style={{ marginTop: spacing.s6 }} />
              ) : (
                <View style={$grid}>
                  {(goalsQuery.data ?? []).map((goal) => {
                    const selected = draft.goals.includes(goal.slug)
                    const emoji = GOAL_EMOJI[goal.slug] ?? "🎯"
                    return (
                      <Pressable
                        key={goal.id}
                        style={[$goalCard, selected && $goalCardSelected]}
                        onPress={() =>
                          setDraft((d) => ({
                            ...d,
                            goals: d.goals.includes(goal.slug)
                              ? d.goals.filter((g) => g !== goal.slug)
                              : [...d.goals, goal.slug],
                          }))
                        }
                      >
                        <Text style={{ fontSize: 30, marginBottom: spacing.s2 }}>{emoji}</Text>
                        <Text style={[$goalLabel, selected && { color: forest500 }]}>
                          {goal.name}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={[$footer, { paddingBottom: insets.bottom + spacing.s2 }]}>
        {finishError ? <Text style={$finishErrorText}>{finishError}</Text> : null}
        <TouchableOpacity
          style={[$ctaBtn, (!ctaEnabled || finishLoading) && $ctaBtnDisabled]}
          onPress={ctaOnPress}
          disabled={!ctaEnabled || finishLoading}
          activeOpacity={0.85}
        >
          {finishLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={$ctaBtnText}>{ctaLabel}</Text>
          )}
        </TouchableOpacity>
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

// Auth screen
const $authScroll: ViewStyle = {
  flexGrow: 1,
  paddingHorizontal: spacing.s5,
  paddingTop: spacing.s6,
  paddingBottom: spacing.s8,
}

const $authBadge: ViewStyle = {
  alignSelf: "flex-start",
  backgroundColor: forest500,
  paddingHorizontal: spacing.s4,
  paddingVertical: 6,
  borderRadius: radii.pill,
  marginBottom: spacing.s6,
}

const $authBadgeText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: "#FFFFFF",
  letterSpacing: 0.3,
}

const $authHeading: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 28,
  color: ink,
  lineHeight: 36,
  marginBottom: spacing.s2,
}

const $authSubtitle: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 15,
  color: ink3,
  lineHeight: 22,
  marginBottom: spacing.s6,
}

const $fieldLabel: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: ink3,
  marginBottom: spacing.s2,
  marginTop: spacing.s3,
}

const $authInput: TextStyle = {
  height: 52,
  borderWidth: 1.5,
  borderColor: hairline,
  borderRadius: radii.xl,
  paddingHorizontal: spacing.s4,
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: ink,
  backgroundColor: card,
}

const $authErrorText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: "#D94F4F",
  marginTop: spacing.s3,
}

const $authToggle: ViewStyle = {
  alignItems: "center",
  paddingVertical: spacing.s4,
  marginTop: spacing.s2,
}

const $authToggleText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink3,
}

const $authToggleLink: TextStyle = {
  fontFamily: typography.primary.bold,
  color: forest500,
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

const $locationWeatherDesc: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 11,
  color: ink4,
  marginTop: 1,
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

const $finishErrorText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: "#D94F4F",
  textAlign: "center",
  marginBottom: spacing.s2,
}

const $ctaBtnText: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: "#FFFFFF",
  letterSpacing: 0.2,
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
