import React, { useEffect, useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { useMutation, useQuery } from "@tanstack/react-query"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { FLOATING_NAV_BOTTOM_GAP, FLOATING_NAV_HEIGHT } from "@/app/(tabs)/_layout"
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
} from "@/theme/tapp-tokens"
import { typography } from "@/theme/typography"

import type { PlanActivity, Priority } from "../domain/entities/activity"
import { getActivitiesForDay } from "../infrastructure/activities-service"
import { MOCK_BOT_GREETING, MOCK_CHAT_SUGGESTIONS } from "../infrastructure/mock-data"
import type { ActivityHighlight, ActivityQuestion } from "../domain/entities/activity-qa"
import {
  askActivityQuestion,
  getDayActivityQuestions,
  getQuestionsForActivity,
  isUuidLike,
  parseAnswerStreamEvent,
} from "../infrastructure/activity-qa-service"
import { subscribeActivitySSE } from "../infrastructure/activity-qa-sse"
import { applyAnswerStreamEvent, upsertActivityQuestion } from "./activity-qa-state"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function priorityColor(priority: Priority): { bg: string; text: string } {
  if (priority === "High") return { bg: statusBadBg, text: statusBad }
  if (priority === "Medium") return { bg: statusWarnBg, text: statusWarn }
  return { bg: statusGoodBg, text: statusGood }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PlanScreen() {
  const insets = useSafeAreaInsets()
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>()

  const dateStr = typeof dateParam === "string" ? dateParam : formatTodayStr()
  const dateLabel = getDateLabel(parseDateStr(dateStr))

  const [loadStatus, setLoadStatus] = useState<"loading" | "ready">("loading")
  const [activities, setActivities] = useState<PlanActivity[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [questionsByActivityId, setQuestionsByActivityId] = useState<Record<string, ActivityQuestion[]>>({})
  const [insightError, setInsightError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadStatus("loading")
    setExpandedId(null)
    setChatOpen(false)

    getActivitiesForDay(dateStr)
      .then((acts) => {
        if (!cancelled) {
          setActivities(acts)
          setLoadStatus("ready")
        }
      })
      .catch((error) => {
        console.error("[plan] failed loading activities", error)
        if (!cancelled) {
          setActivities([])
          setLoadStatus("ready")
          setErrorBanner("Could not load activities. Pull to refresh or try again shortly.")
        }
      })

    return () => {
      cancelled = true
    }
  }, [dateStr])

  useEffect(() => {
    const unsubscribe = subscribeActivitySSE("activity_answer_stream", (payload) => {
      const event = parseAnswerStreamEvent(payload)
      if (!event) return
      let targetActivityId: string | null = null
      setQuestionsByActivityId((prev) => {
        for (const [activityId, questions] of Object.entries(prev)) {
          if (questions.some((q) => q.questionId === event.questionId)) {
            targetActivityId = activityId
            break
          }
        }
        return applyAnswerStreamEvent(prev, event.questionId, event)
      })
      if (event.error) {
        setErrorBanner("Could not fetch one answer. You can retry that question.")
        return
      }
      if (event.isHighlight && event.highlightText && targetActivityId) {
        const nextHighlight: ActivityHighlight = {
          text: event.highlightText,
          addedAt: new Date().toISOString(),
        }
        setActivities((prev) =>
          prev.map((item) => (item.id === targetActivityId ? { ...item, highlight: nextHighlight } : item)),
        )
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.allSettled(
      activities.filter((activity) => isUuidLike(activity.id)).map(async (activity) => ({
        activityId: activity.id,
        questions: await getQuestionsForActivity(activity.id),
      })),
    )
      .then((rows) => {
        if (cancelled) return
        const next: Record<string, ActivityQuestion[]> = {}
        for (const row of rows) {
          if (row.status === "fulfilled") {
            next[row.value.activityId] = row.value.questions
          }
        }
        setQuestionsByActivityId(next)
      })
      .catch((error) => {
        console.warn("[plan] could not load activity questions", error)
      })
    return () => {
      cancelled = true
    }
  }, [activities])

  useEffect(() => {
    const interval = setInterval(() => {
      const pendingActivityIds = Object.entries(questionsByActivityId)
        .filter(([, questions]) => questions.some((q) => q.status === "pending"))
        .map(([activityId]) => activityId)

      for (const activityId of pendingActivityIds) {
        if (!isUuidLike(activityId)) continue
        void getQuestionsForActivity(activityId)
          .then((questions) => {
            setQuestionsByActivityId((prev) => ({ ...prev, [activityId]: questions }))
          })
          .catch(() => {})
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [questionsByActivityId])

  const dayInsights = useQuery({
    queryKey: ["plan", "day-activity-questions", dateStr],
    queryFn: () => getDayActivityQuestions(dateStr),
    retry: 1,
  })

  useEffect(() => {
    if (dayInsights.error) {
      setInsightError("Could not load today's insights right now.")
    } else {
      setInsightError(null)
    }
  }, [dayInsights.error])

  const askQuestionMutation = useMutation({
    mutationFn: ({ activityId, question }: { activityId: string; question: string }) =>
      askActivityQuestion(activityId, question),
  })

  const doneCount = activities.filter((a) => a.done).length
  const totalCount = activities.length
  const percentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const aiPanelBottom = insets.bottom + FLOATING_NAV_BOTTOM_GAP + FLOATING_NAV_HEIGHT
  const collapsedPanelHeight = 56
  const expandedPanelHeight = 260
  const scrollPaddingBottom =
    aiPanelBottom + (chatOpen ? expandedPanelHeight : collapsedPanelHeight) + spacing.s4
  const sendBlockedReason = !chatInput.trim()
    ? "Type a question to send."
    : !expandedId
      ? "Expand an activity first to ask a contextual question."
      : !isUuidLike(expandedId)
        ? "Q&A is unavailable while viewing local fallback activities."
        : null
  const canTapSend = !!chatInput.trim() && !isSubmittingQuestion

  function toggleDone(id: string) {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, done: !a.done } : a)))
  }

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  async function pollQuestionUntilResolved(activityId: string, questionId: string) {
    const maxAttempts = 10
    const delayMs = 1500

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await sleep(delayMs)
      try {
        const questions = await getQuestionsForActivity(activityId)
        setQuestionsByActivityId((prev) => ({ ...prev, [activityId]: questions }))
        const item = questions.find((q) => q.questionId === questionId)
        if (item && (item.status === "answered" || item.status === "failed")) {
          return
        }
      } catch {
        // retry quietly; SSE may still resolve it
      }
    }
  }

  async function submitQuestion(activityId: string, question: string) {
    const trimmed = question.trim()
    if (!trimmed) return
    if (!isUuidLike(activityId)) {
      setErrorBanner("Q&A is unavailable while viewing local fallback activities.")
      return
    }
    const tempQuestionId = `local-${Date.now()}`
    setQuestionsByActivityId((prev) =>
      upsertActivityQuestion(prev, activityId, {
        questionId: tempQuestionId,
        question: trimmed,
        answer: null,
        status: "pending",
        relatedFaqs: [],
        createdAt: new Date().toISOString(),
      }),
    )
    setChatInput("")

    const submitStart = Date.now()
    const minSpinnerMs = 450
    setIsSubmittingQuestion(true)
    try {
      const ack = await askQuestionMutation.mutateAsync({ activityId, question: trimmed })
      setQuestionsByActivityId((prev) => {
        const current = prev[activityId] ?? []
        const mapped = current.map((item) =>
          item.questionId === tempQuestionId ? { ...item, questionId: ack.questionId } : item,
        )
        return { ...prev, [activityId]: mapped }
      })
      // Android environments without EventSource need a polling fallback.
      void pollQuestionUntilResolved(activityId, ack.questionId)
    } catch (error) {
      console.error("[plan] ask question failed", error)
      setQuestionsByActivityId((prev) => {
        const current = prev[activityId] ?? []
        const mapped = current.map((item) =>
          item.questionId === tempQuestionId ? { ...item, status: "failed" as const } : item,
        )
        return { ...prev, [activityId]: mapped }
      })
      setErrorBanner("Question was not sent. Tap retry on the failed item.")
    } finally {
      const elapsed = Date.now() - submitStart
      if (elapsed < minSpinnerMs) {
        await new Promise((resolve) => setTimeout(resolve, minSpinnerMs - elapsed))
      }
      setIsSubmittingQuestion(false)
    }
  }

  function retryQuestion(activityId: string, questionId: string) {
    const question = (questionsByActivityId[activityId] ?? []).find((item) => item.questionId === questionId)
    if (!question) return
    void submitQuestion(activityId, question.question)
  }

  return (
    <KeyboardAvoidingView style={$root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: paper }}
        contentContainerStyle={[
          $scrollContent,
          { paddingTop: insets.top + spacing.s5, paddingBottom: scrollPaddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Text style={$planLabel}>PLAN ON A PAGE</Text>
        <Text style={$dateHeading}>{dateLabel}</Text>
        {errorBanner && (
          <View style={$errorBanner}>
            <Text style={$errorBannerText}>{errorBanner}</Text>
          </View>
        )}

        {/* ── Daily Progress card ── */}
        <View style={$progressCard}>
          <View style={$progressCardHeader}>
            <Text style={$progressCardTitle}>Daily Progress</Text>
            {loadStatus === "ready" ? (
              <Text style={$progressDoneText}>
                {doneCount}/{totalCount} done
              </Text>
            ) : (
              <ActivityIndicator size="small" color={forest500} />
            )}
          </View>
          <View style={$progressBarBg}>
            <View style={[$progressBarFill, { width: `${percentage}%` as any }]} />
          </View>
          <Text style={$progressPercent}>{percentage}% complete</Text>
        </View>

        {/* ── Activities ── */}
        <Text style={$sectionTitle}>Today's Activities</Text>

        {loadStatus === "loading" ? (
          <View style={$loadingContainer}>
            <ActivityIndicator size="large" color={forest500} />
            <Text style={$loadingText}>Loading activities…</Text>
          </View>
        ) : (
          activities.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              dateStr={dateStr}
              isExpanded={expandedId === activity.id}
              questions={questionsByActivityId[activity.id] ?? []}
              onToggleDone={() => toggleDone(activity.id)}
              onToggleExpand={() => toggleExpanded(activity.id)}
              onRetryQuestion={(questionId) => retryQuestion(activity.id, questionId)}
            />
          ))
        )}

        <Text style={[$sectionTitle, { marginTop: spacing.s4 }]}>Today's insights</Text>
        {dayInsights.isLoading ? (
          <Text style={$loadingText}>Loading insights…</Text>
        ) : insightError ? (
          <Text style={$insightErrorText}>{insightError}</Text>
        ) : (dayInsights.data ?? []).length === 0 ? (
          <Text style={$loadingText}>No activity insights yet for this day.</Text>
        ) : (
          (dayInsights.data ?? []).map((item) => (
            <View key={item.activityId} style={$insightCard}>
              <Text style={$insightTitle}>{item.activityTitle}</Text>
              {item.highlight?.text ? <Text style={$insightHighlight}>{item.highlight.text}</Text> : null}
              <Text style={$insightMeta}>{item.questions.length} answered question(s)</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* ── AI Farm Assistant panel (fixed above tab bar) ── */}
      <View pointerEvents="box-none" style={[$aiPanelWrap, { bottom: aiPanelBottom }]}>
      <View style={[$aiPanel, chatOpen && $aiPanelExpanded]}>
        <TouchableOpacity
          style={$aiPanelHeader}
          onPress={() => setChatOpen((v) => !v)}
          activeOpacity={0.8}
          hitSlop={8}
        >
          <View style={$aiAvatarCircle} />
          <Text style={$aiPanelTitle}>AI Farm Assistant</Text>
          <View style={$aiDot} />
          <Ionicons
            name={chatOpen ? "chevron-down" : "chevron-up"}
            size={18}
            color={ink3}
            style={{ marginLeft: spacing.s2 }}
          />
        </TouchableOpacity>

        {chatOpen && (
          <>
            <View style={$chatMessageBubble}>
              <Text style={$chatMessageText}>{MOCK_BOT_GREETING}</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={$chipsScroll}
            >
              {MOCK_CHAT_SUGGESTIONS.map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={$chip}
                  activeOpacity={0.7}
                  onPress={() => setChatInput(chip)}
                >
                  <Text style={$chipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={$chatInputRow}>
              <TextInput
                style={$chatInput}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask about your farm..."
                placeholderTextColor={ink4}
                returnKeyType="send"
              />
              <TouchableOpacity style={$micBtn} hitSlop={8}>
                <Ionicons name="mic-outline" size={20} color={ink3} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[$sendBtn, (!canTapSend || !!sendBlockedReason) && $sendBtnDisabled]}
                activeOpacity={0.85}
                disabled={!canTapSend}
                onPress={() => {
                  if (!expandedId) {
                    setErrorBanner("Expand an activity first, then ask your question.")
                    return
                  }
                  if (!isUuidLike(expandedId)) {
                    setErrorBanner("Q&A is unavailable while viewing local fallback activities.")
                    return
                  }
                  void submitQuestion(expandedId, chatInput)
                }}
              >
                {isSubmittingQuestion ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
            {sendBlockedReason && !isSubmittingQuestion ? (
              <Text style={$sendHelperText}>{sendBlockedReason}</Text>
            ) : null}
          </>
        )}
      </View>
      </View>
    </KeyboardAvoidingView>
  )
}

// ---------------------------------------------------------------------------
// ActivityRow
// ---------------------------------------------------------------------------

function ActivityRow({
  activity,
  dateStr,
  isExpanded,
  questions,
  onToggleDone,
  onToggleExpand,
  onRetryQuestion,
}: {
  activity: PlanActivity
  dateStr: string
  isExpanded: boolean
  questions: ActivityQuestion[]
  onToggleDone: () => void
  onToggleExpand: () => void
  onRetryQuestion: (questionId: string) => void
}) {
  const router = useRouter()
  const p = priorityColor(activity.priority)

  return (
    <View style={[$activityCard, isExpanded && $activityCardExpanded]}>
      <View style={$activityMainRow}>
        <TouchableOpacity
          style={[$checkbox, activity.done && $checkboxDone]}
          onPress={onToggleDone}
          hitSlop={6}
        >
          {activity.done && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </TouchableOpacity>

        <View style={$activityBody}>
          <TouchableOpacity
            onPress={() => {
              if (isUuidLike(activity.id)) {
                router.push(`/activity/${activity.id}` as any)
              } else {
                onToggleExpand()
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={activity.done ? $activityNameDone : $activityName}>{activity.name}</Text>
            <Text style={$activityDuration}>{activity.durationMinutes} min</Text>
            {activity.highlight?.text ? (
              <Text style={$highlightBadge}>{activity.highlight.text}</Text>
            ) : null}
          </TouchableOpacity>
        </View>

        <Text style={[$priorityText, { color: p.text }]}>{activity.priority}</Text>
        <TouchableOpacity onPress={onToggleExpand} hitSlop={8} style={$chevronBtn}>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-forward"} size={16} color={ink4} />
        </TouchableOpacity>
      </View>

      {isExpanded && (
        <View style={$expandedSection}>
          {isUuidLike(activity.id) ? (
            <TouchableOpacity
              style={$journalLink}
              onPress={() => router.push(`/activity/${activity.id}` as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="open-outline" size={14} color={forest500} />
              <Text style={$journalLinkText}>Open activity detail</Text>
              <Ionicons name="arrow-forward" size={13} color={forest500} />
            </TouchableOpacity>
          ) : null}
          {activity.aiTip && (
            <View style={$aiTipRow}>
              <Text style={$aiTipText}>
                <Text style={$aiTipBold}>AI tip: </Text>
                {activity.aiTip}
              </Text>
            </View>
          )}
          {activity.tools && activity.tools.length > 0 && (
            <Text style={$toolsText}>Tools: {activity.tools.join(" · ")}</Text>
          )}

          <TouchableOpacity
            style={$journalLink}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/journal",
                params: {
                  date: dateStr,
                  activityId: activity.id,
                  activityName: activity.name,
                },
              })
            }
            activeOpacity={0.7}
          >
            <Ionicons name="journal-outline" size={14} color={forest500} />
            <Text style={$journalLinkText}>Write journal entry</Text>
            <Ionicons name="arrow-forward" size={13} color={forest500} />
          </TouchableOpacity>

          <View style={$qaSection}>
            {!isUuidLike(activity.id) ? (
              <Text style={$qaEmptyText}>
                Q&A will be available once live server activities load for this day.
              </Text>
            ) : questions.length === 0 ? (
              <Text style={$qaEmptyText}>No questions yet. Ask one from the assistant panel.</Text>
            ) : (
              questions.map((question) => (
                <View key={question.questionId} style={$qaBubble}>
                  <Text style={$qaQuestionText}>Q: {question.question}</Text>
                  {question.status === "pending" ? (
                    <View style={$qaPendingRow}>
                      <ActivityIndicator size="small" color={forest500} />
                      <Text style={$qaPendingText}>Getting answer…</Text>
                    </View>
                  ) : question.status === "failed" ? (
                    <View style={$qaFailedRow}>
                      <Text style={$qaFailedText}>Could not get an answer.</Text>
                      <TouchableOpacity onPress={() => onRetryQuestion(question.questionId)}>
                        <Text style={$qaRetryText}>Try again</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <Text style={$qaAnswerText}>{question.answer}</Text>
                      {question.relatedFaqs.length > 0 && (
                        <View style={$faqChipsWrap}>
                          {question.relatedFaqs.slice(0, 3).map((faq) => (
                            <View key={`${question.questionId}-${faq.question}`} style={$faqChip}>
                              <Text style={$faqChipText}>{faq.question}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      )}
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

const $scrollContent: ViewStyle = {
  paddingHorizontal: spacing.s5,
}

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

const $loadingContainer: ViewStyle = {
  alignItems: "center",
  paddingVertical: spacing.s10,
  gap: spacing.s3,
}

const $loadingText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink3,
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

const $activityCardExpanded: ViewStyle = {
  borderColor: forest500,
}

const $activityMainRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.s4,
  paddingVertical: spacing.s4,
  gap: spacing.s3,
}

const $checkbox: ViewStyle = {
  width: 26,
  height: 26,
  borderRadius: 13,
  borderWidth: 2,
  borderColor: hairline,
  alignItems: "center",
  justifyContent: "center",
}

const $checkboxDone: ViewStyle = {
  backgroundColor: forest500,
  borderColor: forest500,
}

const $activityBody: ViewStyle = {
  flex: 1,
}

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

const $priorityText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 13,
}

const $chevronBtn: ViewStyle = {
  padding: 2,
}

const $expandedSection: ViewStyle = {
  borderTopWidth: 1,
  borderTopColor: hairline,
  paddingHorizontal: spacing.s4,
  paddingVertical: spacing.s3,
  backgroundColor: forest50,
}

const $aiTipRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-start",
  marginBottom: spacing.s2,
}

const $aiTipText: TextStyle = {
  flex: 1,
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink2,
  lineHeight: 19,
}

const $aiTipBold: TextStyle = {
  fontFamily: typography.primary.bold,
  color: ink,
}

const $toolsText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: ink3,
}

const $journalLink: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
  marginTop: spacing.s3,
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

const $aiPanelWrap: ViewStyle = {
  position: "absolute",
  left: spacing.s4,
  right: spacing.s4,
  zIndex: 30,
  elevation: 30,
}

const $aiPanel: ViewStyle = {
  backgroundColor: card,
  borderRadius: radii.xl,
  borderWidth: 1,
  borderColor: hairline,
  overflow: "hidden",
  zIndex: 30,
  ...elevation.sheet,
}

const $aiPanelExpanded: ViewStyle = {
  borderColor: forest500,
}

const $aiPanelHeader: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.s4,
  height: 56,
  gap: spacing.s2,
}

const $aiAvatarCircle: ViewStyle = {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: forest50,
  alignItems: "center",
  justifyContent: "center",
}

const $aiPanelTitle: TextStyle = {
  flex: 1,
  fontFamily: typography.primary.bold,
  fontSize: 14,
  color: ink,
}

const $aiDot: ViewStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: statusGood,
}

const $chatMessageBubble: ViewStyle = {
  marginHorizontal: spacing.s4,
  marginBottom: spacing.s3,
  backgroundColor: paper,
  borderRadius: radii.lg,
  padding: spacing.s3,
}

const $chatMessageText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink2,
  lineHeight: 19,
}

const $chipsScroll: ViewStyle = {
  paddingHorizontal: spacing.s4,
  gap: spacing.s2,
  marginBottom: spacing.s3,
}

const $chip: ViewStyle = {
  backgroundColor: forest50,
  borderRadius: radii.pill,
  borderWidth: 1,
  borderColor: forest500,
  paddingHorizontal: spacing.s3,
  paddingVertical: 6,
}

const $chipText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: forest500,
}

const $chatInputRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.s4,
  paddingBottom: spacing.s3,
  gap: spacing.s2,
}

const $chatInput: TextStyle = {
  flex: 1,
  height: 42,
  backgroundColor: paper,
  borderRadius: radii.pill,
  paddingHorizontal: spacing.s4,
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink,
  borderWidth: 1,
  borderColor: hairline,
}

const $micBtn: ViewStyle = {
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: paper,
  borderWidth: 1,
  borderColor: hairline,
  alignItems: "center",
  justifyContent: "center",
}

const $sendBtn: ViewStyle = {
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: forest500,
  alignItems: "center",
  justifyContent: "center",
}

const $sendBtnDisabled: ViewStyle = {
  backgroundColor: hairline,
  opacity: 0.8,
}

const $sendHelperText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 11,
  color: ink3,
  paddingHorizontal: spacing.s4,
  paddingBottom: spacing.s3,
}

const $errorBanner: ViewStyle = {
  backgroundColor: statusBadBg,
  borderColor: statusBad,
  borderWidth: 1,
  borderRadius: radii.lg,
  padding: spacing.s3,
  marginBottom: spacing.s4,
}

const $errorBannerText: TextStyle = {
  fontFamily: typography.primary.medium,
  color: statusBad,
  fontSize: 12,
}

const $highlightBadge: TextStyle = {
  marginTop: spacing.s1,
  fontFamily: typography.primary.medium,
  fontSize: 11,
  color: forest500,
}

const $qaSection: ViewStyle = {
  marginTop: spacing.s3,
  gap: spacing.s2,
}

const $qaEmptyText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: ink3,
}

const $qaBubble: ViewStyle = {
  backgroundColor: card,
  borderRadius: radii.lg,
  padding: spacing.s3,
  borderWidth: 1,
  borderColor: hairline,
}

const $qaQuestionText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: ink,
  marginBottom: spacing.s1,
}

const $qaAnswerText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: ink2,
  lineHeight: 18,
}

const $qaPendingRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
}

const $qaPendingText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: ink3,
}

const $qaFailedRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
}

const $qaFailedText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: statusBad,
}

const $qaRetryText: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 12,
  color: forest500,
}

const $faqChipsWrap: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.s2,
  marginTop: spacing.s2,
}

const $faqChip: ViewStyle = {
  borderColor: forest500,
  borderWidth: 1,
  borderRadius: radii.pill,
  paddingHorizontal: spacing.s2,
  paddingVertical: 3,
}

const $faqChipText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 11,
  color: forest500,
}

const $insightCard: ViewStyle = {
  backgroundColor: card,
  borderColor: cardBorder,
  borderWidth: 1,
  borderRadius: radii.lg,
  padding: spacing.s3,
  marginBottom: spacing.s2,
}

const $insightTitle: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 13,
  color: ink,
}

const $insightMeta: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: ink3,
}

const $insightHighlight: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: forest500,
  marginVertical: spacing.s1,
}

const $insightErrorText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: statusBad,
}
