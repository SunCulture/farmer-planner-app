import { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useQueryClient } from "@tanstack/react-query"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { container } from "@/bootstrap/container"
import { ApiErrorView } from "@/components/ApiErrorView"
import { loadAuthToken } from "@/modules/onboarding"
import type { SseClient } from "@/shared/contracts/sse"
import { getApiErrorMessage, isNotFoundError } from "@/shared/infrastructure/api-error"
import { plannerKeys } from "@/shared/query-keys"
import type { ContestReaction } from "@/services/api/planner-types"
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

import {
  useContestActivity,
  useMarkActivityDone,
  useSkipActivity,
} from "../application/use-activity-actions"
import { useActivityDetail } from "../application/use-activity-detail"
import { useActivityQA } from "../application/use-activity-qa"
import type { ActivityHighlight } from "../domain/entities/activity-highlight"
import { statusColorToUi } from "../infrastructure/api-mappers"
import { AskQuestionBar } from "./components/AskQuestionBar"
import { HighlightBadge } from "./components/HighlightBadge"
import { QuestionBubble } from "./components/QuestionBubble"

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
  const queryClient = useQueryClient()
  const params = useLocalSearchParams<{ activityId?: string; id?: string }>()
  const activityId = (params.activityId ?? params.id ?? "") as string

  const { data: activity, isLoading, isError, error, refetch } = useActivityDetail(activityId)
  const markDone = useMarkActivityDone(activityId)
  const skip = useSkipActivity(activityId)
  const contest = useContestActivity(activityId)

  const [localHighlight, setLocalHighlight] = useState<ActivityHighlight | null>(null)
  const [qaInput, setQaInput] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)

  const [skipOpen, setSkipOpen] = useState(false)
  const [skipNote, setSkipNote] = useState("")
  const [contestOpen, setContestOpen] = useState(false)
  const [contestReaction, setContestReaction] = useState<ContestReaction>("not_relevant")
  const [contestNote, setContestNote] = useState("")
  const [contestPending, setContestPending] = useState(false)

  const scrollRef = useRef<ScrollView>(null)

  const qa = useActivityQA(activityId, (highlight) => {
    setLocalHighlight(highlight)
  })

  useEffect(() => {
    const sse = container.resolve<SseClient>("sseClient")
    if (!sse) return
    const token = loadAuthToken()
    if (token) sse.connect(token)

    const unsub = sse.on<{ activityId: string }>("activity_refined", (payload) => {
      if (payload.activityId !== activityId) return
      setContestPending(false)
      queryClient.invalidateQueries({ queryKey: plannerKeys.activity(activityId) })
      queryClient.invalidateQueries({ queryKey: plannerKeys.home() })
    })
    return unsub
  }, [activityId, queryClient])

  const highlight = localHighlight ?? activity?.highlight ?? null

  async function handleDone() {
    setActionError(null)
    try {
      await markDone.mutateAsync()
    } catch (err) {
      setActionError(getApiErrorMessage(err))
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
      setActionError(getApiErrorMessage(err))
    }
  }

  async function handleContestSubmit() {
    if (contestNote.trim().length < 10) {
      Alert.alert("Add more detail", "Please write at least 10 characters so we can refine this task.")
      return
    }
    setActionError(null)
    try {
      await contest.mutateAsync({ reaction: contestReaction, note: contestNote.trim() })
      setContestOpen(false)
      setContestPending(true)
      setContestNote("")
    } catch (err) {
      setActionError(getApiErrorMessage(err))
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
  const education = activity.educationBrief?.trim() || activity.description?.trim() || null
  const busy = markDone.isPending || skip.isPending || contest.isPending

  return (
    <KeyboardAvoidingView style={$root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[$header, { paddingTop: insets.top + spacing.s2 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={$backBtn}>
          <Ionicons name="arrow-back" size={22} color={ink} />
        </TouchableOpacity>
        <Text style={$headerTitle} numberOfLines={1}>
          Activity
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={$scroll}
        contentContainerStyle={[$scrollContent, { paddingBottom: insets.bottom + spacing.s10 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={$titleRow}>
          <Text style={$titleIcon}>{activity.iconEmoji}</Text>
          <Text style={$title}>{activity.title}</Text>
        </View>

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

        {highlight ? <HighlightBadge highlight={highlight} /> : null}

        {contestPending ? (
          <View style={$pendingBanner}>
            <ActivityIndicator size="small" color={forest600} />
            <Text style={$pendingBannerText}>Updating this task with your feedback…</Text>
          </View>
        ) : null}

        <Text style={$sectionTitle}>Why this matters</Text>
        {education ? (
          <Text style={$educationText}>{education}</Text>
        ) : (
          <Text style={$emptyQaText}>Education for this task will appear here.</Text>
        )}

        {actionError ? <Text style={$actionError}>{actionError}</Text> : null}

        <View style={$actionsRow}>
          <TouchableOpacity
            style={[$actionBtn, $actionDone]}
            onPress={handleDone}
            disabled={busy || activity.status.code === "DONE" || activity.status.code === "VERIFIED"}
            activeOpacity={0.85}
          >
            {markDone.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                <Text style={$actionDoneText}>Done</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[$actionBtn, $actionSecondary]}
            onPress={handleSkip}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Ionicons name="close-circle-outline" size={18} color={ink2} />
            <Text style={$actionSecondaryText}>Didn&apos;t do</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[$actionBtn, $actionSecondary]}
            onPress={() => setContestOpen(true)}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={ink2} />
            <Text style={$actionSecondaryText}>Contest</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={$journalLink}
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/journal",
              params: {
                date: activity.date,
                activityId: activity.id,
                activityName: activity.title,
                activityIcon: activity.iconEmoji,
                mode: "new",
              },
            })
          }
        >
          <Ionicons name="journal-outline" size={16} color={forest500} />
          <Text style={$journalLinkText}>Log in journal (optional for Verified)</Text>
          <Ionicons name="arrow-forward" size={14} color={forest500} />
        </TouchableOpacity>

        <View style={$divider} />
        <Text style={$sectionTitle}>Ask a question</Text>
        <AskQuestionBar
          value={qaInput}
          onChangeText={setQaInput}
          onSend={async () => {
            const text = qaInput.trim()
            if (!text) return
            setQaInput("")
            await qa.ask(text)
          }}
        />

        {qa.isLoading ? (
          <ActivityIndicator size="small" color={forest500} style={{ marginVertical: spacing.s3 }} />
        ) : null}
        {qa.isError ? (
          <ApiErrorView error={qa.error} onRetry={() => qa.refetch()} title="Could not load Q&A" />
        ) : null}
        {!qa.isLoading && qa.questions.length === 0 ? (
          <Text style={$emptyQaText}>No questions yet — ask anything about this activity.</Text>
        ) : null}
        {qa.questions.map((question) => (
          <QuestionBubble
            key={question.questionId}
            question={question}
            onRetry={() => qa.retry(question)}
            onFaqPress={(faq) => setQaInput(faq)}
          />
        ))}
      </ScrollView>

      <Modal visible={skipOpen} animationType="slide" transparent onRequestClose={() => setSkipOpen(false)}>
        <View style={$modalBackdrop}>
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
        </View>
      </Modal>

      <Modal visible={contestOpen} animationType="slide" transparent onRequestClose={() => setContestOpen(false)}>
        <View style={$modalBackdrop}>
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
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const $root: ViewStyle = { flex: 1, backgroundColor: paper }
const $scroll: ViewStyle = { flex: 1 }
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
  borderRadius: 999,
  paddingHorizontal: spacing.s3,
  paddingVertical: spacing.s1,
}
const $categoryChipText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: forest600,
}
const $statusBadge: ViewStyle = {
  borderRadius: 999,
  paddingHorizontal: spacing.s3,
  paddingVertical: spacing.s1,
}
const $statusBadgeText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 12,
}
const $sectionTitle: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 15,
  color: ink,
  marginBottom: spacing.s2,
  marginTop: spacing.s2,
}
const $educationText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink2,
  lineHeight: 21,
  marginBottom: spacing.s4,
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
const $actionDone: ViewStyle = { backgroundColor: forest500 }
const $actionDoneText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 13,
  color: "#FFF",
}
const $actionSecondary: ViewStyle = {
  backgroundColor: forest50,
  borderWidth: 1,
  borderColor: forest100,
}
const $actionSecondaryText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 12,
  color: ink2,
}
const $journalLink: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
  paddingVertical: spacing.s3,
  marginBottom: spacing.s2,
}
const $journalLinkText: TextStyle = {
  flex: 1,
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: forest500,
}
const $divider: ViewStyle = {
  height: 1,
  backgroundColor: hairline,
  marginVertical: spacing.s4,
}
const $emptyQaText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink3,
  marginVertical: spacing.s3,
}
const $loadingText: TextStyle = {
  marginTop: spacing.s3,
  fontFamily: typography.primary.normal,
  color: ink3,
}
const $emptyTitle: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: ink,
  marginBottom: spacing.s3,
}
const $emptyLink: ViewStyle = { padding: spacing.s2 }
const $emptyLinkText: TextStyle = {
  fontFamily: typography.primary.semiBold,
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
  borderRadius: 999,
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
