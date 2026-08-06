import React, { useCallback } from "react"
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { useFocusEffect, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useQueryClient } from "@tanstack/react-query"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { FLOATING_NAV_CLEARANCE } from "@/app/(tabs)/_layout"
import { ApiErrorView } from "@/components/ApiErrorView"
import { GlyphMark } from "@/components/GlyphMark"
import { SoftEmptyState } from "@/components/SoftEmptyState"
import { loadFarmerProfile } from "@/modules/onboarding"
import { ActivitySuggestionsBanner } from "@/modules/plan"
import type { ActivityCard } from "@/modules/plan/domain/entities/activity-card"
import { statusColorToUi } from "@/modules/plan/infrastructure/api-mappers"
import { emptyStateGlyph, iconKeyToGlyph } from "@/modules/plan/infrastructure/icon-key-map"
import { plannerKeys } from "@/shared/query-keys"
import {
  card,
  cardBorder,
  elevation,
  forest50,
  forest500,
  hairline,
  ink,
  ink2,
  ink3,
  ink4,
  paperCool,
  radii,
  spacing,
  statusBad,
  statusBadBg,
  statusGood,
  statusGoodBg,
  statusWarn,
  statusWarnBg,
} from "@/theme/tujiweze-tokens"
import { typography } from "@/theme/typography"

import { useHomeDashboard } from "../application/use-home-dashboard"

function getDynamicSubtitle(cropIds: string[]): string {
  if (cropIds.length === 0) return "Check your farm plan for today."
  return "Your farm plan is ready — see today's activities below."
}

function statusUiColors(color: string): { bg: string; text: string } {
  const ui = statusColorToUi(color)
  if (ui === "good") return { bg: statusGoodBg, text: statusGood }
  if (ui === "warn") return { bg: statusWarnBg, text: statusWarn }
  return { bg: statusBadBg, text: statusBad }
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const queryClient = useQueryClient()
  const profile = loadFarmerProfile()

  const { data: dashboard, isLoading, isError, error, refetch } = useHomeDashboard()

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.home() })
    }, [queryClient]),
  )

  const firstName = profile?.name?.split(" ")[0] ?? "Farmer"
  const firstInitial = firstName.charAt(0).toUpperCase()
  const subtitle = getDynamicSubtitle(profile?.cropIds ?? [])

  const weekStrip = dashboard?.weekStrip ?? []
  const todayActivities = dashboard?.todaySection.activities ?? []
  const remaining = todayActivities.filter(
    (a) => a.status.code !== "VERIFIED" && a.status.code !== "DONE" && a.status.code !== "SKIPPED",
  ).length
  const planSummary =
    dashboard?.todaySection.tips[0]?.body ?? dashboard?.activePlan?.summary ?? null
  const planTitle = dashboard?.activePlan?.title

  if (isLoading && !dashboard) {
    return (
      <View style={[$root, $centered]}>
        <ActivityIndicator size="large" color={forest500} />
      </View>
    )
  }

  if (isError && !dashboard) {
    return (
      <View style={[$root, $centered, { paddingTop: insets.top }]}>
        <ApiErrorView error={error} onRetry={() => refetch()} title="Could not load home" />
      </View>
    )
  }

  return (
    <ScrollView
      style={$root}
      contentContainerStyle={{ paddingBottom: FLOATING_NAV_CLEARANCE + spacing.s4 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[$heroCard, { paddingTop: insets.top + spacing.s4 }]}>
        <View style={$header}>
          <View style={{ flex: 1 }}>
            <Text style={$greeting}>Good morning, {firstName}</Text>
            <Text style={$greetingSubtitle}>{subtitle}</Text>
          </View>
          <TouchableOpacity
            style={$avatar}
            onPress={() => router.push("/profile" as any)}
            activeOpacity={0.75}
            hitSlop={8}
          >
            <Text style={$avatarText}>{firstInitial}</Text>
          </TouchableOpacity>
        </View>

        <View style={$weekStrip}>
          {weekStrip.map((day) => {
            const isPast = !day.isToday && !day.hasPlan && day.statusColor === "muted"
            const dateNum = Number(day.date.split("-")[2])
            return (
              <TouchableOpacity
                key={day.date}
                style={$dayItem}
                onPress={() =>
                  router.push({ pathname: "/(tabs)/plan", params: { date: day.date } })
                }
                activeOpacity={0.7}
              >
                <Text style={$dayLabel}>{day.dayLabel}</Text>
                <View
                  style={[
                    $dayCircle,
                    day.isToday && $dayCircleToday,
                    day.hasPlan && !day.isToday && $dayCirclePast,
                  ]}
                >
                  {isPast ? (
                    <Ionicons name="checkmark" size={14} color={forest500} />
                  ) : (
                    <Text style={day.isToday ? $dayNumToday : $dayNum}>{dateNum}</Text>
                  )}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <View style={$lowerSection}>
        <ActivitySuggestionsBanner />

        {planTitle || planSummary ? (
          <View style={$tipCard}>
            {planTitle ? <Text style={$tipTitle}>{planTitle}</Text> : null}
            {planSummary ? <Text style={$tipText}>{planSummary}</Text> : null}
          </View>
        ) : null}

        <View style={$sectionHeaderRow}>
          <Text style={$sectionTitle}>{dashboard?.todaySection.title ?? "Today's Activities"}</Text>
          <View style={$remainingBadge}>
            <Text style={$remainingText}>{remaining} remaining</Text>
          </View>
        </View>

        {todayActivities.length === 0 ? (
          <SoftEmptyState
            heading={
              dashboard?.activePlanId ? "Nothing scheduled today" : "No activities yet"
            }
            body={
              dashboard?.activePlanId
                ? "Check another day on the week strip, or open Plan."
                : "Start a plan to see today's activities."
            }
            source={emptyStateGlyph("sprout")}
            fallbackIcon="leaf-outline"
          />
        ) : (
          todayActivities.map((activity) => (
            <HomeActivityCard key={activity.id} activity={activity} />
          ))
        )}
      </View>
    </ScrollView>
  )
}


function HomeActivityCard({ activity }: { activity: ActivityCard }) {
  const router = useRouter()
  const colors = statusUiColors(activity.status.color)

  return (
    <TouchableOpacity
      style={$activityCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/activity/${activity.id}` as any)}
    >
      <GlyphMark
        source={iconKeyToGlyph(activity.iconKey)}
        fallbackIcon="leaf-outline"
        size="md"
        style={$activityIconMark}
      />
      <View style={$activityBody}>
        <View style={$activityTitleRow}>
          <Text style={$activityName} numberOfLines={2}>
            {activity.title}
          </Text>
          <View style={[$statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[$statusText, { color: colors.text }]}>{activity.status.label}</Text>
          </View>
        </View>
        {activity.subtitle ? (
          <Text style={$activityDuration} numberOfLines={1}>
            {activity.subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={ink4} />
    </TouchableOpacity>
  )
}

const $root: ViewStyle = { flex: 1, backgroundColor: paperCool }
const $centered: ViewStyle = { flex: 1, justifyContent: "center", alignItems: "center" }
const $heroCard: ViewStyle = {
  backgroundColor: card,
  borderBottomLeftRadius: radii.xl,
  borderBottomRightRadius: radii.xl,
  paddingHorizontal: spacing.s5,
  paddingBottom: spacing.s5,
  marginBottom: spacing.s5,
  ...elevation.card,
}
const $header: ViewStyle = { flexDirection: "row", alignItems: "center", marginBottom: spacing.s4 }
const $greeting: TextStyle = {
  fontFamily: typography.display.bold,
  fontSize: 24,
  color: ink,
  lineHeight: 30,
}
const $greetingSubtitle: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink3,
  marginTop: 2,
}
const $avatar: ViewStyle = {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: forest500,
  alignItems: "center",
  justifyContent: "center",
  marginLeft: spacing.s4,
}
const $avatarText: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: "#FFFFFF",
}
const $weekStrip: ViewStyle = { flexDirection: "row", marginBottom: spacing.s4, gap: 4 }
const $dayItem: ViewStyle = { flex: 1, alignItems: "center", gap: spacing.s2 }
const $dayLabel: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 11,
  color: ink3,
}
const $dayCircle: ViewStyle = {
  width: 32,
  height: 32,
  borderRadius: 16,
  borderWidth: 1.5,
  borderColor: hairline,
  alignItems: "center",
  justifyContent: "center",
}
const $dayCircleToday: ViewStyle = { backgroundColor: forest500, borderColor: forest500 }
const $dayCirclePast: ViewStyle = { borderColor: forest500, backgroundColor: forest50 }
const $dayNum: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: ink3,
}
const $dayNumToday: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 12,
  color: "#FFFFFF",
}
const $lowerSection: ViewStyle = { paddingHorizontal: spacing.s5 }
const $sectionHeaderRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: spacing.s3,
}
const $sectionTitle: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: ink,
}
const $remainingBadge: ViewStyle = {
  backgroundColor: forest50,
  borderRadius: radii.pill,
  paddingHorizontal: spacing.s3,
  paddingVertical: 3,
}
const $remainingText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: forest500,
}
const $activityCard: ViewStyle = {
  backgroundColor: card,
  borderRadius: radii.xl,
  borderWidth: 1,
  borderColor: cardBorder,
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.s4,
  paddingVertical: spacing.s4,
  marginBottom: spacing.s3,
  ...elevation.card,
}
const $activityIconMark: ViewStyle = {
  marginRight: spacing.s3,
}
const $activityBody: ViewStyle = { flex: 1 }
const $activityTitleRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
}
const $activityName: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: ink,
  flex: 1,
}
const $statusBadge: ViewStyle = {
  borderRadius: radii.pill,
  paddingHorizontal: spacing.s2,
  paddingVertical: 2,
}
const $statusText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 11,
}
const $activityDuration: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: ink3,
  marginTop: 2,
}
const $tipCard: ViewStyle = {
  backgroundColor: forest50,
  borderRadius: radii.lg,
  padding: spacing.s3,
  marginBottom: spacing.s4,
}
const $tipTitle: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 14,
  color: ink,
  marginBottom: 2,
}
const $tipText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink2,
  lineHeight: 18,
}
