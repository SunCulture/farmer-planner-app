import React, { useCallback, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useQueryClient } from "@tanstack/react-query"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { FLOATING_NAV_BOTTOM_GAP, FLOATING_NAV_HEIGHT } from "@/app/(tabs)/_layout"
import { ApiErrorView } from "@/components/ApiErrorView"
import { useGeneratePlan } from "@/modules/plan/application/use-generate-plan"
import { usePlanChat } from "@/modules/plan/application/use-plan-chat"
import { isNotFoundError } from "@/shared/infrastructure/api-error"
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
  paper,
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

import { ActivitySuggestionsBanner } from "./ActivitySuggestionsBanner"
import { AiAssistantPanel, type AiChatMessage } from "./components/AiAssistantPanel"
import { getActivityErrorMessage } from "../application/activity-errors"
import { useMarkActivityDone, useSkipActivity } from "../application/use-activity-actions"
import { useDayPlan } from "../application/use-day-plan"
import type { ActivityCard } from "../domain/entities/activity-card"
import type { SuggestionCard } from "../domain/entities/plan-chat"
import { statusColorToUi } from "../infrastructure/api-mappers"

const CHAT_SUGGESTIONS = [
  "Rain is expected tomorrow. Should I delay field work?",
  "How do I protect maize from armyworm?",
  "What should I focus on this week?",
]

function formatTodayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function getDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

function statusUiColors(color: string): { bg: string; text: string } {
  const ui = statusColorToUi(color)
  if (ui === "good") return { bg: statusGoodBg, text: statusGood }
  if (ui === "warn") return { bg: statusWarnBg, text: statusWarn }
  return { bg: statusBadBg, text: statusBad }
}

export default function PlanScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>()

  const dateStr = typeof dateParam === "string" ? dateParam : formatTodayStr()
  const dateLabel = getDateLabel(parseDateStr(dateStr))

  const { data: dayPlan, isLoading, isError, error, refetch } = useDayPlan(dateStr)
  const generatePlan = useGeneratePlan()
  const planChat = usePlanChat(dayPlan?.planId)

  type ChatMessage = AiChatMessage & { suggestionCards: SuggestionCard[] }

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.dayPlan(dateStr) })
    }, [queryClient, dateStr]),
  )

  const activities = dayPlan?.activities ?? []
  const doneCount = activities.filter(
    (a) => a.status.code === "DONE" || a.status.code === "VERIFIED",
  ).length
  const totalCount = activities.length
  const percentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const aiPanelBottom = insets.bottom + FLOATING_NAV_BOTTOM_GAP + FLOATING_NAV_HEIGHT
  const collapsedPanelHeight = 56
  const expandedPanelHeight = Math.min(Math.round(Dimensions.get("window").height * 0.78), 640)
  const scrollPaddingBottom =
    aiPanelBottom + (chatOpen ? expandedPanelHeight : collapsedPanelHeight) + spacing.s4

  async function handleSendChat(explicit?: string) {
    const message = (explicit ?? chatInput).trim()
    if (!message || !dayPlan?.planId || planChat.isPending) return
    setChatInput("")
    const userId = `u-${Date.now()}`
    setChatMessages((prev) => [
      ...prev,
      { id: userId, role: "user", text: message, suggestionCards: [] },
    ])
    if (!chatOpen) setChatOpen(true)
    try {
      const result = await planChat.mutateAsync(message)
      setChatMessages((prev) => [
        ...prev,
        {
          id: result.messageId || `a-${Date.now()}`,
          role: "assistant",
          text: result.reply.markdown || result.reply.plain,
          suggestionCards: result.suggestionCards,
        },
      ])
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: "Sorry, I could not reach the farm assistant right now.",
          suggestionCards: [],
        },
      ])
    }
  }

  async function handleStartPlan() {
    try {
      await generatePlan.mutateAsync({ durationDays: 5, startDate: dateStr })
      refetch()
    } catch {
      // user can try from home templates
    }
  }

  if (isLoading && !dayPlan) {
    return (
      <View style={[$root, $centered]}>
        <ActivityIndicator size="large" color={forest500} />
        <Text style={$loadingText}>Loading plan…</Text>
      </View>
    )
  }

  if (isError && !dayPlan) {
    if (isNotFoundError(error)) {
      return (
        <View style={[$root, $emptyState, { paddingTop: insets.top + spacing.s5 }]}>
          <Text style={$planLabel}>PLAN ON A PAGE</Text>
          <Text style={$dateHeading}>{dateLabel}</Text>
          <Text style={$emptyTitle}>No plan for this day</Text>
          <Text style={$emptyBody}>Start a farm plan from Home or generate one now.</Text>
          <TouchableOpacity
            style={$emptyCta}
            onPress={handleStartPlan}
            disabled={generatePlan.isPending}
            activeOpacity={0.85}
          >
            {generatePlan.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={$emptyCtaText}>Generate 5-day plan</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(tabs)/" as any)} style={$emptyLink}>
            <Text style={$emptyLinkText}>Browse templates on Home</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <View style={[$root, $centered, { paddingTop: insets.top }]}>
        <ApiErrorView error={error} onRetry={() => refetch()} title="Could not load plan" />
      </View>
    )
  }

  return (
    <View style={$root}>
      <ScrollView
        style={{ flex: 1, backgroundColor: paper }}
        contentContainerStyle={[
          $scrollContent,
          { paddingTop: insets.top + spacing.s5, paddingBottom: scrollPaddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={$planLabel}>PLAN ON A PAGE</Text>
        <Text style={$dateHeading}>{dateLabel}</Text>

        <ActivitySuggestionsBanner />

        {dayPlan?.hero ? (
          <View style={$heroCard}>
            <Text style={$heroTitle}>{dayPlan.hero.title}</Text>
            <Text style={$heroSummary}>{dayPlan.hero.summary}</Text>
          </View>
        ) : null}

        <View style={$progressCard}>
          <View style={$progressCardHeader}>
            <Text style={$progressCardTitle}>Daily Progress</Text>
            <Text style={$progressDoneText}>
              {doneCount}/{totalCount} done
            </Text>
          </View>
          <View style={$progressBarBg}>
            <View style={[$progressBarFill, { width: `${percentage}%` as `${number}%` }]} />
          </View>
          <Text style={$progressPercent}>{percentage}% complete</Text>
        </View>

        <Text style={$sectionTitle}>Today's Activities</Text>

        {activities.map((activity) => (
          <ActivityRow
            key={activity.id}
            activity={activity}
            dateStr={dateStr}
            isExpanded={expandedId === activity.id}
            onToggleExpand={() =>
              setExpandedId((prev) => (prev === activity.id ? null : activity.id))
            }
          />
        ))}

        {dayPlan?.tips && dayPlan.tips.length > 0 ? (
          <>
            <Text style={[$sectionTitle, { marginTop: spacing.s4 }]}>Tips</Text>
            {dayPlan.tips.map((tip, i) => (
              <View key={tip.id ?? `tip-${i}`} style={$tipCard}>
                <Text style={$tipText}>{tip.body}</Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>

      <AiAssistantPanel
        title={dayPlan?.chatCtaLabel ?? "AI Farm Assistant"}
        expanded={chatOpen}
        onToggle={() => setChatOpen((v) => !v)}
        messages={chatMessages}
        input={chatInput}
        onChangeInput={setChatInput}
        onSend={handleSendChat}
        pending={planChat.isPending}
        starterChips={CHAT_SUGGESTIONS}
        bottomOffset={aiPanelBottom}
        renderAfterMessage={(msg) => {
          const cards = (msg as ChatMessage).suggestionCards
          if (!cards || cards.length === 0) return null
          return (
            <>
              {cards.map((suggestion) => (
                <View key={suggestion.id} style={$suggestionCard}>
                  <View style={$suggestionCardBody}>
                    <Text style={$suggestionCardTitle}>{suggestion.title}</Text>
                    <Text style={$suggestionCardReason}>{suggestion.reason}</Text>
                  </View>
                  <TouchableOpacity style={$suggestionCardCta} activeOpacity={0.7}>
                    <Text style={$suggestionCardCtaText}>{suggestion.ctaLabel}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )
        }}
      />
    </View>
  )
}

function ActivityRow({
  activity,
  dateStr,
  isExpanded,
  onToggleExpand,
}: {
  activity: ActivityCard
  dateStr: string
  isExpanded: boolean
  onToggleExpand: () => void
}) {
  const router = useRouter()
  const markDone = useMarkActivityDone(activity.id)
  const skip = useSkipActivity(activity.id)
  const [actionError, setActionError] = useState<string | null>(null)

  const colors = statusUiColors(activity.status.color)
  const isVerified = activity.status.code === "VERIFIED"
  const isComplete =
    activity.status.code === "DONE" ||
    activity.status.code === "VERIFIED" ||
    activity.status.code === "SKIPPED"
  const busy = markDone.isPending || skip.isPending

  async function handleMarkDone() {
    setActionError(null)
    try {
      await markDone.mutateAsync()
    } catch (err) {
      setActionError(getActivityErrorMessage(err))
    }
  }

  function handleSkip() {
    Alert.alert("Skip this task?", "Mark it as not done for today. You can still journal later.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Skip",
        style: "destructive",
        onPress: async () => {
          setActionError(null)
          try {
            await skip.mutateAsync(undefined)
          } catch (err) {
            setActionError(getActivityErrorMessage(err))
          }
        },
      },
    ])
  }

  return (
    <View style={[$activityCard, isExpanded && $activityCardExpanded]}>
      <TouchableOpacity
        style={$activityMainRow}
        onPress={onToggleExpand}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={`${activity.title}. ${isExpanded ? "Collapse" : "Expand"} options`}
      >
        <View style={[$statusDot, { backgroundColor: colors.text }]} />

        <View style={$activityIconCircle}>
          <Text style={$activityIcon}>{activity.iconEmoji}</Text>
        </View>

        <View style={$activityBody}>
          <Text style={isVerified ? $activityNameDone : $activityName}>{activity.title}</Text>
          {activity.subtitle ? <Text style={$activityDuration}>{activity.subtitle}</Text> : null}
        </View>

        <View style={[$statusBadge, { backgroundColor: colors.bg }]}>
          <Text style={[$statusBadgeText, { color: colors.text }]}>{activity.status.label}</Text>
        </View>

        <View style={$chevronBtn}>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-forward"} size={16} color={ink4} />
        </View>
      </TouchableOpacity>

      {isExpanded ? (
        <View style={$expandedSection}>
          {activity.description ? (
            <Text style={$descriptionText}>{activity.description}</Text>
          ) : null}

          {actionError ? <Text style={$inlineActionError}>{actionError}</Text> : null}

          <TouchableOpacity
            style={$journalLink}
            onPress={() => router.push(`/activity/${activity.id}` as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={forest500} />
            <Text style={$journalLinkText}>
              {activity.highlight ? activity.highlight.text : "View details & ask a question"}
            </Text>
            <Ionicons name="arrow-forward" size={13} color={forest500} />
          </TouchableOpacity>

          <TouchableOpacity
            style={$journalLink}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/journal",
                params: {
                  date: dateStr,
                  activityId: activity.id,
                  activityName: activity.title,
                  activityIcon: activity.iconEmoji,
                  mode: "new",
                },
              })
            }
            activeOpacity={0.7}
          >
            <Ionicons name="journal-outline" size={14} color={forest500} />
            <Text style={$journalLinkText}>Journal</Text>
            <Ionicons name="arrow-forward" size={13} color={forest500} />
          </TouchableOpacity>

          {!isComplete ? (
            <View style={$inlineActionsRow}>
              <TouchableOpacity
                style={[$inlineActionBtn, $inlineChoiceBtn]}
                onPress={handleMarkDone}
                disabled={busy}
                activeOpacity={0.85}
              >
                {markDone.isPending ? (
                  <ActivityIndicator color={ink2} size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={16} color={ink2} />
                    <Text style={$inlineChoiceText}>Mark done</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[$inlineActionBtn, $inlineChoiceBtn]}
                onPress={handleSkip}
                disabled={busy}
                activeOpacity={0.85}
              >
                {skip.isPending ? (
                  <ActivityIndicator color={ink2} size="small" />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={16} color={ink2} />
                    <Text style={$inlineChoiceText}>Didn&apos;t do</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

const $root: ViewStyle = { flex: 1, backgroundColor: paper }
const $centered: ViewStyle = { flex: 1, justifyContent: "center", alignItems: "center" }
const $scrollContent: ViewStyle = { paddingHorizontal: spacing.s5 }
const $planLabel: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 11,
  color: forest500,
  letterSpacing: 1,
  textTransform: "uppercase",
  marginBottom: spacing.s1,
}
const $dateHeading: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 26,
  color: ink,
  lineHeight: 32,
  marginBottom: spacing.s5,
}
const $heroCard: ViewStyle = {
  backgroundColor: forest50,
  borderRadius: radii.lg,
  padding: spacing.s4,
  marginBottom: spacing.s4,
}
const $heroTitle: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 15,
  color: ink,
  marginBottom: spacing.s1,
}
const $heroSummary: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink2,
  lineHeight: 18,
}
const $progressCard: ViewStyle = {
  backgroundColor: card,
  borderRadius: radii.xl,
  borderWidth: 1,
  borderColor: cardBorder,
  padding: spacing.s4,
  marginBottom: spacing.s6,
  ...elevation.card,
}
const $progressCardHeader: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.s3,
}
const $progressCardTitle: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 15,
  color: ink,
}
const $progressDoneText: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 14,
  color: forest500,
}
const $progressBarBg: ViewStyle = {
  height: 8,
  backgroundColor: hairline,
  borderRadius: radii.pill,
  overflow: "hidden",
  marginBottom: spacing.s2,
}
const $progressBarFill: ViewStyle = {
  height: 8,
  backgroundColor: forest500,
  borderRadius: radii.pill,
}
const $progressPercent: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: ink3,
  textAlign: "right",
}
const $sectionTitle: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: ink,
  marginBottom: spacing.s3,
}
const $loadingText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink3,
  marginTop: spacing.s3,
}
const $emptyState: ViewStyle = { paddingHorizontal: spacing.s5 }
const $emptyTitle: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: ink,
  marginBottom: spacing.s2,
}
const $emptyBody: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink3,
  marginBottom: spacing.s5,
  lineHeight: 20,
}
const $emptyCta: ViewStyle = {
  backgroundColor: forest500,
  borderRadius: radii.pill,
  paddingVertical: spacing.s4,
  alignItems: "center",
  marginBottom: spacing.s3,
}
const $emptyCtaText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 15,
  color: "#FFFFFF",
}
const $emptyLink: ViewStyle = { alignItems: "center", padding: spacing.s3 }
const $emptyLinkText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: forest500,
}
const $activityCard: ViewStyle = {
  backgroundColor: card,
  borderRadius: radii.xl,
  borderWidth: 1,
  borderColor: cardBorder,
  marginBottom: spacing.s3,
  overflow: "hidden",
  ...elevation.card,
}
const $activityCardExpanded: ViewStyle = { borderColor: forest500 }
const $activityMainRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.s4,
  paddingVertical: spacing.s4,
  gap: spacing.s3,
}
const $statusDot: ViewStyle = { width: 8, height: 8, borderRadius: 4 }
const $activityIconCircle: ViewStyle = {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: forest50,
  alignItems: "center",
  justifyContent: "center",
}
const $activityIcon: TextStyle = { fontSize: 18 }
const $activityBody: ViewStyle = { flex: 1 }
const $activityName: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: ink,
  lineHeight: 19,
}
const $activityNameDone: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: ink3,
  lineHeight: 19,
  textDecorationLine: "line-through",
}
const $activityDuration: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: ink3,
  marginTop: 1,
}
const $statusBadge: ViewStyle = {
  borderRadius: radii.pill,
  paddingHorizontal: spacing.s2,
  paddingVertical: 2,
}
const $statusBadgeText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 11,
}
const $chevronBtn: ViewStyle = { padding: 2 }
const $expandedSection: ViewStyle = {
  borderTopWidth: 1,
  borderTopColor: hairline,
  paddingHorizontal: spacing.s4,
  paddingVertical: spacing.s3,
  backgroundColor: forest50,
}
const $descriptionText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink2,
  lineHeight: 19,
  marginBottom: spacing.s2,
}
const $journalLink: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
  marginTop: spacing.s2,
  paddingTop: spacing.s3,
  borderTopWidth: 1,
  borderTopColor: hairline,
}
const $journalLinkText: TextStyle = {
  flex: 1,
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: forest500,
}
const $inlineActionError: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: statusBad,
  marginBottom: spacing.s2,
}
const $inlineActionsRow: ViewStyle = {
  flexDirection: "row",
  gap: spacing.s2,
  marginTop: spacing.s3,
  paddingTop: spacing.s3,
  borderTopWidth: 1,
  borderTopColor: hairline,
}
const $inlineActionBtn: ViewStyle = {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.s1,
  borderRadius: radii.pill,
  paddingVertical: spacing.s3,
  minHeight: 40,
}
const $inlineChoiceBtn: ViewStyle = {
  backgroundColor: card,
  borderWidth: 1,
  borderColor: cardBorder,
}
const $inlineChoiceText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 13,
  color: ink2,
}
const $tipCard: ViewStyle = {
  backgroundColor: forest50,
  borderRadius: radii.lg,
  padding: spacing.s3,
  marginBottom: spacing.s2,
}
const $tipText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink2,
  lineHeight: 18,
}
const $suggestionCard: ViewStyle = {
  backgroundColor: forest50,
  borderRadius: radii.lg,
  borderWidth: 1,
  borderColor: hairline,
  marginBottom: spacing.s2,
  overflow: "hidden",
}
const $suggestionCardBody: ViewStyle = {
  padding: spacing.s3,
}
const $suggestionCardTitle: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 13,
  color: ink,
  marginBottom: 2,
}
const $suggestionCardReason: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: ink3,
}
const $suggestionCardCta: ViewStyle = {
  borderTopWidth: 1,
  borderTopColor: hairline,
  paddingHorizontal: spacing.s3,
  paddingVertical: spacing.s2,
  alignItems: "flex-start",
}
const $suggestionCardCtaText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 13,
  color: forest500,
}
