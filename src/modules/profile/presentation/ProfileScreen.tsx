import React from "react"
import {
  ScrollView,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { loadFarmerProfile } from "@/modules/onboarding"
import { useCrops, useGoals, useLivestock } from "@/modules/onboarding/application/use-catalog-queries"
import {
  card,
  forest50,
  forest100,
  forest500,
  hairline,
  ink,
  ink2,
  ink3,
  ink4,
  paper,
  radii,
  spacing,
  statusGood,
  statusGoodBg,
} from "@/theme/tapp-tokens"
import { typography } from "@/theme/typography"

// ---------------------------------------------------------------------------
// Display-only emoji lookups (match onboarding)
// ---------------------------------------------------------------------------

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
// Helpers
// ---------------------------------------------------------------------------

function acreageLabel(acreage: number): string {
  if (acreage <= 1) return "Small farm · under 1 acre"
  if (acreage <= 5) return "Medium farm · 1–5 acres"
  return "Large farm · over 5 acres"
}

function acreageEmoji(acreage: number): string {
  if (acreage <= 1) return "🌿"
  if (acreage <= 5) return "🌾"
  return "🌳"
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return <Text style={$sectionTitle}>{title}</Text>
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <View style={$infoRow}>
      <Text style={$infoIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={$infoLabel}>{label}</Text>
        <Text style={$infoValue}>{value}</Text>
      </View>
    </View>
  )
}

function TagChip({ emoji, label }: { emoji: string; label: string }) {
  return (
    <View style={$chip}>
      <Text style={$chipEmoji}>{emoji}</Text>
      <Text style={$chipLabel}>{label}</Text>
    </View>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={$emptyState}>
      <Text style={$emptyStateText}>{message}</Text>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const profile = loadFarmerProfile()
  const cropsQuery = useCrops()
  const livestockQuery = useLivestock()
  const goalsQuery = useGoals()

  if (!profile) {
    return (
      <View style={[$root, { paddingTop: insets.top }]}>
        <View style={$topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={$backBtn}>
            <Ionicons name="chevron-back" size={24} color={ink} />
          </TouchableOpacity>
          <Text style={$topBarTitle}>My Profile</Text>
          <View style={{ width: 36 }} />
        </View>
        <EmptyState message="No profile data found. Complete onboarding first." />
      </View>
    )
  }

  const firstName = profile.name?.split(" ")[0] ?? "Farmer"
  const initials = profile.name
    ? profile.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "F"

  const locationEmoji = profile.location.county
    ? (REGION_EMOJI[profile.location.county] ?? "📍")
    : "📍"

  const isCrops = profile.productionType === "CROPS"
  const isMixed = profile.productionType === "MIXED"

  // Resolve crop names from catalog, fallback to slug
  const allCrops = cropsQuery.data ?? []
  const resolvedCrops = profile.cropIds.map((id) => {
    const found = allCrops.find((c) => c.id === id)
    const slug = found?.slug ?? id
    return { name: found?.name ?? id, emoji: CROP_EMOJI[slug] ?? "🌱" }
  })

  // Resolve livestock names from catalog, fallback to slug
  const allLivestock = livestockQuery.data ?? []
  const resolvedLivestock = profile.livestockIds.map((id) => {
    const found = allLivestock.find((a) => a.id === id)
    const slug = found?.slug ?? id
    return { name: found?.name ?? id, emoji: LIVESTOCK_EMOJI[slug] ?? "🐾" }
  })

  // Resolve goal names from catalog, fallback to slug
  const allGoals = goalsQuery.data ?? []
  const resolvedGoals = profile.goalSlugs.map((slug) => {
    const found = allGoals.find((g) => g.slug === slug)
    return { name: found?.name ?? slug, emoji: GOAL_EMOJI[slug] ?? "🎯" }
  })

  const farmTypeLabel =
    profile.productionType === "CROPS"
      ? "Crops"
      : profile.productionType === "LIVESTOCK"
        ? "Livestock"
        : "Mixed farming"
  const farmTypeEmoji =
    profile.productionType === "CROPS" ? "🌱" : profile.productionType === "LIVESTOCK" ? "🐄" : "🌿🐄"

  const workStyleLabel =
    profile.helpersLevel === "SOLO" ? "Solo farmer" : "Farms with helpers"
  const workStyleEmoji = profile.helpersLevel === "SOLO" ? "🧑‍🌾" : "👨‍👩‍👧"

  const showCrops = isCrops || isMixed
  const showLivestock = !isCrops || isMixed

  return (
    <View style={[$root, { backgroundColor: paper }]}>
      {/* Top bar */}
      <View style={[$topBar, { paddingTop: insets.top + spacing.s2 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={$backBtn}>
          <Ionicons name="chevron-back" size={24} color={ink} />
        </TouchableOpacity>
        <Text style={$topBarTitle}>My Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[$scroll, { paddingBottom: insets.bottom + spacing.s8 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={$heroCard}>
          <View style={$avatarLarge}>
            <Text style={$avatarLargeText}>{initials}</Text>
          </View>
          <Text style={$heroName}>{profile.name}</Text>
          <View style={$heroBadgeRow}>
            <View style={$heroBadge}>
              <Text style={$heroBadgeText}>{locationEmoji} {profile.location.label}</Text>
            </View>
            <View style={$heroBadge}>
              <Text style={$heroBadgeText}>{farmTypeEmoji} {farmTypeLabel}</Text>
            </View>
          </View>
        </View>

        {/* ── Farm Identity ── */}
        <View style={$section}>
          <SectionHeader title="Farm Identity" />
          <View style={$card}>
            <InfoRow
              icon="📍"
              label="Location"
              value={`${profile.location.label}${profile.location.country ? `, ${profile.location.country}` : ""}`}
            />
            <View style={$divider} />
            <InfoRow
              icon={farmTypeEmoji}
              label="Farming type"
              value={farmTypeLabel}
            />
            <View style={$divider} />
            <InfoRow
              icon={acreageEmoji(profile.acreage)}
              label="Farm size"
              value={acreageLabel(profile.acreage)}
            />
            <View style={$divider} />
            <InfoRow
              icon={workStyleEmoji}
              label="Work style"
              value={workStyleLabel}
            />
          </View>
        </View>

        {/* ── Crops ── */}
        {showCrops && (
          <View style={$section}>
            <SectionHeader title="Crops" />
            {resolvedCrops.length === 0 ? (
              <EmptyState message="No crops selected during onboarding." />
            ) : (
              <View style={$chipRow}>
                {resolvedCrops.map((crop) => (
                  <TagChip key={crop.name} emoji={crop.emoji} label={crop.name} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Livestock ── */}
        {showLivestock && (
          <View style={$section}>
            <SectionHeader title="Livestock" />
            {resolvedLivestock.length === 0 ? (
              <EmptyState message="No livestock selected during onboarding." />
            ) : (
              <View style={$chipRow}>
                {resolvedLivestock.map((animal) => (
                  <TagChip key={animal.name} emoji={animal.emoji} label={animal.name} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Goals ── */}
        <View style={$section}>
          <SectionHeader title="Farming Goals" />
          {resolvedGoals.length === 0 ? (
            <EmptyState message="No goals selected during onboarding." />
          ) : (
            <View style={$goalsList}>
              {resolvedGoals.map((goal, i) => (
                <View key={goal.name} style={[$goalItem, i < resolvedGoals.length - 1 && $goalItemBorder]}>
                  <View style={$goalIconCircle}>
                    <Text style={{ fontSize: 18 }}>{goal.emoji}</Text>
                  </View>
                  <Text style={$goalLabel}>{goal.name}</Text>
                  <Ionicons name="checkmark-circle" size={18} color={statusGood} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Onboarding completion badge ── */}
        <View style={$completionBadge}>
          <Ionicons name="checkmark-circle" size={16} color={statusGood} style={{ marginRight: 6 }} />
          <Text style={$completionText}>Onboarding complete · Farm plan active</Text>
        </View>
      </ScrollView>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const $root: ViewStyle = {
  flex: 1,
  backgroundColor: paper,
}

const $topBar: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: spacing.s5,
  paddingBottom: spacing.s3,
  backgroundColor: paper,
}

const $backBtn: ViewStyle = {
  width: 36,
  height: 36,
  alignItems: "center",
  justifyContent: "center",
}

const $topBarTitle: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 17,
  color: ink,
}

const $scroll: ViewStyle = {
  paddingHorizontal: spacing.s5,
  paddingTop: spacing.s2,
  gap: spacing.s4,
}

const $heroCard: ViewStyle = {
  backgroundColor: card,
  borderRadius: radii.xl,
  alignItems: "center",
  paddingVertical: spacing.s6,
  paddingHorizontal: spacing.s5,
  borderWidth: 1,
  borderColor: hairline,
}

const $avatarLarge: ViewStyle = {
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: forest500,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: spacing.s4,
}

const $avatarLargeText: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 28,
  color: "#FFFFFF",
}

const $heroName: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 22,
  color: ink,
  marginBottom: spacing.s3,
}

const $heroBadgeRow: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.s2,
  justifyContent: "center",
}

const $heroBadge: ViewStyle = {
  backgroundColor: forest50,
  borderRadius: radii.pill,
  paddingHorizontal: spacing.s3,
  paddingVertical: 6,
}

const $heroBadgeText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: forest500,
}

const $section: ViewStyle = {
  gap: spacing.s3,
}

const $sectionTitle: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 13,
  color: ink3,
  letterSpacing: 0.8,
  textTransform: "uppercase",
}

const $card: ViewStyle = {
  backgroundColor: card,
  borderRadius: radii.xl,
  borderWidth: 1,
  borderColor: hairline,
  paddingVertical: spacing.s2,
  paddingHorizontal: spacing.s4,
}

const $infoRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.s3,
  gap: spacing.s3,
}

const $infoIcon: TextStyle = {
  fontSize: 20,
  width: 28,
  textAlign: "center",
}

const $infoLabel: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: ink3,
  marginBottom: 2,
}

const $infoValue: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 15,
  color: ink,
}

const $divider: ViewStyle = {
  height: 1,
  backgroundColor: hairline,
  marginLeft: 28 + spacing.s3,
}

const $chipRow: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.s2,
}

const $chip: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: card,
  borderRadius: radii.pill,
  borderWidth: 1.5,
  borderColor: forest100,
  paddingHorizontal: spacing.s3,
  paddingVertical: spacing.s2,
  gap: 6,
}

const $chipEmoji: TextStyle = {
  fontSize: 16,
}

const $chipLabel: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: ink2,
}

const $goalsList: ViewStyle = {
  backgroundColor: card,
  borderRadius: radii.xl,
  borderWidth: 1,
  borderColor: hairline,
  paddingVertical: spacing.s2,
  paddingHorizontal: spacing.s4,
}

const $goalItem: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.s3,
  gap: spacing.s3,
}

const $goalItemBorder: ViewStyle = {
  borderBottomWidth: 1,
  borderBottomColor: hairline,
}

const $goalIconCircle: ViewStyle = {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: forest50,
  alignItems: "center",
  justifyContent: "center",
}

const $goalLabel: TextStyle = {
  flex: 1,
  fontFamily: typography.primary.medium,
  fontSize: 15,
  color: ink,
}

const $completionBadge: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.s3,
}

const $completionText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: statusGood,
}

const $emptyState: ViewStyle = {
  backgroundColor: card,
  borderRadius: radii.lg,
  borderWidth: 1,
  borderColor: hairline,
  paddingVertical: spacing.s4,
  paddingHorizontal: spacing.s4,
  alignItems: "center",
}

const $emptyStateText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink4,
  textAlign: "center",
}
