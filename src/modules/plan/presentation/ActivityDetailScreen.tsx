import { useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import {
  KeyboardAwareScrollView,
  KeyboardAvoidingView,
  type KeyboardAwareScrollViewRef,
} from "react-native-keyboard-controller"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ApiErrorView } from "@/components/ApiErrorView"
import type { ContestReaction } from "@/services/api"
import { isNotFoundError } from "@/shared/infrastructure/api-error"
import {
  forest50,
  forest100,
  forest500,
  forest600,
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

import { getActivityErrorMessage } from "../application/activity-errors"
import {
  useContestActivity,
  useMarkActivityDone,
  useSkipActivity,
} from "../application/use-activity-actions"
import { useActivityDetail } from "../application/use-activity-detail"
import { useActivityQA } from "../application/use-activity-qa"
import type { ActivityHighlight } from "../domain/entities/activity-highlight"
import { statusColorToUi } from "../infrastructure/api-mappers"
import { ActivityEducationSection } from "./components/ActivityEducationSection"
import { AiAssistantPanel, type AiChatMessage } from "./components/AiAssistantPanel"
import { HighlightBadge } from "./components/HighlightBadge"

const REACTIONS: { id: ContestReaction; label: string }[] = [
  { id: "too_hard", label: "Too hard" },
  { id: "too_easy", label: "Too easy" },
  { id: "not_relevant", label: "Not relevant" },
  { id: "loved_it", label: "Loved it" },
]

function statusUiColors(color: string): { bg: string; text: string } {
  const ui = statusColorToUi(color)
  if (ui === "good") return { bg: statusGoodBg, text: statusGood }
  if (ui === "warn") return { bg: statusWarnBg, text: statusWarn }
  return { bg: statusBadBg, text: statusBad }
}

export default function ActivityDetailScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const activityId = typeof id === "string" ? id : ""

  const {
    data: activity,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useActivityDetail(activityId)
  const markDone = useMarkActivityDone(activityId)
  const skip = useSkipActivity(activityId)
  const contest = useContestActivity(activityId)

  const [localHighlight, setLocalHighlight] = useState<ActivityHighlight | null>(null)
  const [input, setInput] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)

  const [skipOpen, setSkipOpen] = useState(false)
  const [skipNote, setSkipNote] = useState("")
  const [contestOpen, setContestOpen] = useState(false)
  const [contestReaction, setContestReaction] = useState<ContestReaction>("not_relevant")
  const [contestNote, setContestNote] = useState("")
  const [contestPending, setContestPending] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null)
  const prevFetching = useRef(false)

  const qa = useActivityQA(activityId, (highlight) => {
    setLocalHighlight(highlight)
  })

  const chatMessages: AiChatMessage[] = useMemo(() => {
    const messages: AiChatMessage[] = []
    for (const question of qa.questions) {
      messages.push({
        id: `${question.questionId}-q`,
        role: "user",
        text: question.question,
      })
      if (question.status === "answered" && question.answer) {
        messages.push({
          id: `${question.questionId}-a`,
          role: "assistant",
          text: question.answer,
          chips: question.relatedFaqs.map((faq) => faq.question),
        })
      } else if (question.status === "failed") {
        messages.push({
          id: `${question.questionId}-a`,
          role: "assistant",
          text: "Couldn't get an answer. Please try again.",
        })
      }
    }
    return messages
  }, [qa.questions])

  const chatPending = qa.isAsking || qa.questions.some((question) => question.status === "pending")

  useEffect(() => {
    setLocalHighlight(null)
    setContestPending(false)
    setActionError(null)
    setChatOpen(false)
  }, [activityId])

  useEffect(() => {
    if (contestPending && prevFetching.current && !isFetching && activity) {
      setContestPending(false)
    }
    prevFetching.current = isFetching
  }, [contestPending, isFetching, activity])

  const highlight = localHighlight ?? activity?.highlight ?? null

  function scrollToHighlightSource() {
    setChatOpen(true)
  }

  async function handleSend(explicit?: string) {
    const text = (explicit ?? input).trim()
    if (!text) return
    setInput("")
    setActionError(null)
    if (!chatOpen) setChatOpen(true)
    try {
      await qa.ask(text)
    } catch (err) {
      setActionError(getActivityErrorMessage(err))
      setInput(text)
    }
  }

  async function handleDone() {
    setActionError(null)
    try {
      await markDone.mutateAsync()
    } catch (err) {
      setActionError(getActivityErrorMessage(err))
    }
  }

  function handleSkip() {
    setSkipNote("")
    setSkipOpen(true)
  }

  async function handleSkipSubmit() {
    setActionError(null)
    try {
      await skip.mutateAsync(skipNote.trim() || undefined)
      setSkipOpen(false)
      setSkipNote("")
    } catch (err) {
      setActionError(getActivityErrorMessage(err))
    }
  }

  async function handleContestSubmit() {
    if (contestNote.trim().length < 10) {
      Alert.alert(
        "Add more detail",
        "Please write at least 10 characters so we can refine this task.",
      )
      return
    }
    setActionError(null)
    try {
      await contest.mutateAsync({ reaction: contestReaction, note: contestNote.trim() })
      setContestOpen(false)
      setContestPending(true)
      setContestNote("")
    } catch (err) {
      setActionError(getActivityErrorMessage(err))
    }
  }

  if (isLoading && !activity) {
    return (
      <View style={[$root, $centered]}>
        <ActivityIndicator size="large" color={forest500} />
        <Text style={$loadingText}>Loading activity…</Text>
      </View>
    )
  }

  if (isError && !activity) {
    if (isNotFoundError(error)) {
      return (
        <View style={[$root, $centered, { paddingTop: insets.top }]}>
          <Text style={$emptyTitle}>Activity not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={$emptyLink}>
            <Text style={$emptyLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return (
      <View style={[$root, $centered, { paddingTop: insets.top }]}>
        <ApiErrorView error={error} onRetry={() => refetch()} title="Could not load activity" />
      </View>
    )
  }

  if (!activity) return null

  const colors = statusUiColors(activity.status.color)
  const busy = markDone.isPending || skip.isPending || contest.isPending
  const chatBottom = Math.max(insets.bottom, spacing.s3)
  const collapsedChatHeight = 56
  const expandedChatHeight = Math.min(Math.round(Dimensions.get("window").height * 0.78), 640)
  const scrollBottomPad =
    chatBottom + (chatOpen ? expandedChatHeight : collapsedChatHeight) + spacing.s4

  return (
    <View style={$root}>
      <View style={[$header, { paddingTop: insets.top + spacing.s2 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={$backBtn}>
          <Ionicons name="arrow-back" size={22} color={ink} />
        </TouchableOpacity>
        <Text style={$headerTitle} numberOfLines={1}>
          Activity Detail
        </Text>
      </View>

      <KeyboardAwareScrollView
        ref={scrollRef}
        style={$scroll}
        contentContainerStyle={[$scrollContent, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={spacing.s6}
      >
        <View style={$titleRow}>
          {activity.iconEmoji ? <Text style={$titleIcon}>{activity.iconEmoji}</Text> : null}
          <Text style={$title}>{activity.title}</Text>
        </View>

        {highlight ? (
          <HighlightBadge highlight={highlight} onPress={scrollToHighlightSource} />
        ) : null}

        <View style={$metaRow}>
          {activity.subtitle ? (
            <View style={$categoryChip}>
              <Text style={$categoryChipText}>{activity.subtitle}</Text>
            </View>
          ) : null}
          <View style={[$statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[$statusBadgeText, { color: colors.text }]}>{activity.status.label}</Text>
          </View>
        </View>

        {contestPending ? (
          <View style={$pendingBanner}>
            <ActivityIndicator size="small" color={forest600} />
            <Text style={$pendingBannerText}>Updating this task with your feedback…</Text>
          </View>
        ) : null}

        {actionError ? <Text style={$actionError}>{actionError}</Text> : null}

        {activity.status.code === "DONE" ||
        activity.status.code === "VERIFIED" ||
        activity.status.code === "SKIPPED" ? null : (
          <View style={$actionsRow}>
            <TouchableOpacity
              style={[$actionBtn, $actionChoice]}
              onPress={handleDone}
              disabled={busy}
              activeOpacity={0.85}
            >
              {markDone.isPending ? (
                <ActivityIndicator color={ink2} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color={ink2} />
                  <Text style={$actionChoiceText}>Done</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[$actionBtn, $actionChoice]}
              onPress={handleSkip}
              disabled={busy}
              activeOpacity={0.85}
            >
              <Ionicons name="close-circle-outline" size={18} color={ink2} />
              <Text style={$actionChoiceText}>Didn&apos;t do</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[$actionBtn, $actionChoice]}
              onPress={() => setContestOpen(true)}
              disabled={busy}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={ink2} />
              <Text style={$actionChoiceText}>Contest</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={$journalLink}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/journal",
              params: {
                date: activity.date,
                activityId: activity.id,
                activityName: activity.title,
                mode: "new",
              },
            })
          }
        >
          <Ionicons name="journal-outline" size={16} color={forest500} />
          <Text style={$journalLinkText}>Journal</Text>
          <Ionicons name="arrow-forward" size={14} color={forest500} />
        </TouchableOpacity>

        <ActivityEducationSection
          activityId={activity.id}
          education={activity.education}
          educationProgress={activity.educationProgress}
          fallbackText={activity.educationBrief?.trim() || activity.description}
        />

        {qa.isError ? (
          <View style={{ marginTop: spacing.s4 }}>
            <ApiErrorView
              error={qa.error}
              onRetry={() => qa.refetch()}
              title="Could not load Q&A"
            />
          </View>
        ) : null}
      </KeyboardAwareScrollView>

      <AiAssistantPanel
        title="Ask about this activity"
        expanded={chatOpen}
        onToggle={() => setChatOpen((open) => !open)}
        messages={chatMessages}
        input={input}
        onChangeInput={setInput}
        onSend={handleSend}
        pending={chatPending}
        allowSendWhilePending
        placeholder="Ask anything about this activity..."
        emptyPrompt="No questions yet — ask anything about this activity."
        bottomOffset={chatBottom}
        renderAfterMessage={(msg) => {
          const question = qa.questions.find(
            (q) => msg.id === `${q.questionId}-a` && q.status === "failed",
          )
          if (!question) return null
          return (
            <TouchableOpacity
              style={$retryChip}
              onPress={() => qa.retry(question)}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={13} color={forest500} />
              <Text style={$retryChipText}>Try again</Text>
            </TouchableOpacity>
          )
        }}
      />

      <Modal
        visible={skipOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setSkipOpen(false)}
      >
        <KeyboardAvoidingView style={$modalBackdrop} behavior="padding">
          <View style={[$modalSheet, { paddingBottom: insets.bottom + spacing.s4 }]}>
            <Text style={$modalTitle}>Didn&apos;t do this task</Text>
            <Text style={$modalHint}>Optional: tell us why you skipped it.</Text>
            <TextInput
              style={$contestInput}
              value={skipNote}
              onChangeText={setSkipNote}
              placeholder="Reason (optional)"
              placeholderTextColor={ink4}
              multiline
              textAlignVertical="top"
            />
            <View style={$modalActions}>
              <TouchableOpacity style={$modalCancel} onPress={() => setSkipOpen(false)}>
                <Text style={$modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={$modalSubmit}
                onPress={handleSkipSubmit}
                disabled={skip.isPending}
              >
                {skip.isPending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={$modalSubmitText}>Skip task</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={contestOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setContestOpen(false)}
      >
        <KeyboardAvoidingView style={$modalBackdrop} behavior="padding">
          <View style={[$modalSheet, { paddingBottom: insets.bottom + spacing.s4 }]}>
            <Text style={$modalTitle}>Contest / add info</Text>
            <Text style={$modalHint}>Tell us what to change about this task.</Text>
            <View style={$reactionRow}>
              {REACTIONS.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[$reactionChip, contestReaction === r.id && $reactionChipActive]}
                  onPress={() => setContestReaction(r.id)}
                >
                  <Text style={[$reactionText, contestReaction === r.id && $reactionTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={$contestInput}
              value={contestNote}
              onChangeText={setContestNote}
              placeholder="What should we change? (min 10 characters)"
              placeholderTextColor={ink4}
              multiline
              textAlignVertical="top"
            />
            <View style={$modalActions}>
              <TouchableOpacity style={$modalCancel} onPress={() => setContestOpen(false)}>
                <Text style={$modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={$modalSubmit}
                onPress={handleContestSubmit}
                disabled={contest.isPending}
              >
                {contest.isPending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={$modalSubmitText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const $root: ViewStyle = { flex: 1, backgroundColor: paper }
const $scroll: ViewStyle = { flex: 1, backgroundColor: paper }
const $centered: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.s5,
}
const $header: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.s4,
  paddingBottom: spacing.s3,
  backgroundColor: paper,
  gap: spacing.s3,
}
const $backBtn: ViewStyle = { padding: spacing.s1 }
const $headerTitle: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 15,
  color: ink,
}
const $scrollContent: ViewStyle = { paddingHorizontal: spacing.s5 }
const $titleRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
  marginBottom: spacing.s3,
}
const $titleIcon: TextStyle = { fontSize: 22 }
const $title: TextStyle = {
  flex: 1,
  fontFamily: typography.primary.bold,
  fontSize: 22,
  color: ink,
  lineHeight: 28,
}
const $metaRow: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.s2,
  marginBottom: spacing.s4,
  alignItems: "center",
}
const $categoryChip: ViewStyle = {
  backgroundColor: forest50,
  borderRadius: radii.pill,
  paddingHorizontal: spacing.s3,
  paddingVertical: spacing.s1,
}
const $categoryChipText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: forest500,
}
const $statusBadge: ViewStyle = {
  borderRadius: radii.pill,
  paddingHorizontal: spacing.s3,
  paddingVertical: spacing.s1,
}
const $statusBadgeText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 12,
}
const $actionsRow: ViewStyle = {
  flexDirection: "row",
  gap: spacing.s2,
  marginBottom: spacing.s3,
}
const $actionBtn: ViewStyle = {
  flex: 1,
  minHeight: 48,
  borderRadius: radii.lg,
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",
  gap: spacing.s1,
  paddingHorizontal: spacing.s2,
}
const $actionChoice: ViewStyle = {
  backgroundColor: forest50,
  borderWidth: 1,
  borderColor: forest100,
}
const $actionChoiceText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 12,
  color: ink2,
}
const $journalLink: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
  paddingVertical: spacing.s3,
  marginBottom: spacing.s5,
}
const $journalLinkText: TextStyle = {
  flex: 1,
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: forest500,
}
const $loadingText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink3,
  marginTop: spacing.s3,
}
const $emptyTitle: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: ink,
  marginBottom: spacing.s3,
}
const $emptyLink: ViewStyle = { padding: spacing.s3 }
const $emptyLinkText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: forest500,
}
const $actionError: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: statusBad,
  marginBottom: spacing.s3,
}
const $pendingBanner: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
  backgroundColor: forest50,
  borderRadius: radii.lg,
  padding: spacing.s3,
  marginBottom: spacing.s3,
}
const $pendingBannerText: TextStyle = {
  flex: 1,
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: forest600,
}
const $retryChip: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "flex-start",
  gap: spacing.s1,
  backgroundColor: forest50,
  borderRadius: radii.pill,
  borderWidth: 1,
  borderColor: hairline,
  paddingHorizontal: spacing.s3,
  paddingVertical: spacing.s2,
}
const $retryChipText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 12,
  color: forest500,
}
const $modalBackdrop: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "flex-end",
}
const $modalSheet: ViewStyle = {
  backgroundColor: paper,
  borderTopLeftRadius: radii.xl,
  borderTopRightRadius: radii.xl,
  padding: spacing.s5,
}
const $modalTitle: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: ink,
  marginBottom: spacing.s1,
}
const $modalHint: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink3,
  marginBottom: spacing.s4,
}
const $reactionRow: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.s2,
  marginBottom: spacing.s3,
}
const $reactionChip: ViewStyle = {
  borderRadius: radii.pill,
  borderWidth: 1,
  borderColor: hairline,
  paddingHorizontal: spacing.s3,
  paddingVertical: spacing.s2,
}
const $reactionChipActive: ViewStyle = {
  backgroundColor: forest50,
  borderColor: forest500,
}
const $reactionText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: ink3,
}
const $reactionTextActive: TextStyle = { color: forest600 }
const $contestInput: TextStyle = {
  minHeight: 100,
  borderWidth: 1,
  borderColor: hairline,
  borderRadius: radii.lg,
  padding: spacing.s3,
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink,
  marginBottom: spacing.s4,
}
const $modalActions: ViewStyle = { flexDirection: "row", gap: spacing.s3 }
const $modalCancel: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.s3,
}
const $modalCancelText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  color: ink3,
}
const $modalSubmit: ViewStyle = {
  flex: 1,
  backgroundColor: forest500,
  borderRadius: radii.lg,
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.s3,
  minHeight: 48,
}
const $modalSubmitText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  color: "#FFF",
}
