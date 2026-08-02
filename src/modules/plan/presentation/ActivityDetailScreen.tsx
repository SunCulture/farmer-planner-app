import { useRef, useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ApiErrorView } from "@/components/ApiErrorView"
import { isNotFoundError } from "@/shared/infrastructure/api-error"
import {
  forest50,
  forest500,
  hairline,
  ink,
  ink2,
  ink3,
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

import { useActivityDetail } from "../application/use-activity-detail"
import { useActivityQA } from "../application/use-activity-qa"
import type { ActivityHighlight } from "../domain/entities/activity-highlight"
import { statusColorToUi } from "../infrastructure/api-mappers"
import { AskQuestionBar } from "./components/AskQuestionBar"
import { HighlightBadge } from "./components/HighlightBadge"
import { QuestionBubble } from "./components/QuestionBubble"

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

  const { data: activity, isLoading, isError, error, refetch } = useActivityDetail(activityId)

  const [localHighlight, setLocalHighlight] = useState<ActivityHighlight | null>(null)
  const [highlightSourceId, setHighlightSourceId] = useState<string | null>(null)
  const [input, setInput] = useState("")

  const scrollRef = useRef<ScrollView>(null)
  const qaSectionY = useRef(0)
  const questionYs = useRef<Map<string, number>>(new Map())

  const qa = useActivityQA(activityId, (highlight, sourceQuestionId) => {
    setLocalHighlight(highlight)
    setHighlightSourceId(sourceQuestionId)
  })

  const highlight = localHighlight ?? activity?.highlight ?? null

  function scrollToHighlightSource() {
    const y = highlightSourceId ? questionYs.current.get(highlightSourceId) : undefined
    scrollRef.current?.scrollTo({ y: y ?? qaSectionY.current, animated: true })
  }

  async function handleSend() {
    const text = input.trim()
    if (!text) return
    setInput("")
    await qa.ask(text)
  }

  function handleFaqPress(faqQuestion: string) {
    setInput(faqQuestion)
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

  return (
    <KeyboardAvoidingView style={$root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[$header, { paddingTop: insets.top + spacing.s2 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={$backBtn}>
          <Ionicons name="arrow-back" size={22} color={ink} />
        </TouchableOpacity>
        <Text style={$headerTitle} numberOfLines={1}>
          Activity Detail
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={$scroll}
        contentContainerStyle={[$scrollContent, { paddingBottom: insets.bottom + spacing.s10 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={$titleRow}>
          <Text style={$titleIcon}>{activity.iconEmoji}</Text>
          <Text style={$title}>{activity.title}</Text>
        </View>

        {highlight ? (
          <HighlightBadge highlight={highlight} onPress={scrollToHighlightSource} />
        ) : null}

        {activity.description ? <Text style={$description}>{activity.description}</Text> : null}

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

        <TouchableOpacity
          style={$completeBtn}
          activeOpacity={0.85}
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
          <Text style={$completeBtnText}>{activity.ctaLabel ?? "Complete"}</Text>
        </TouchableOpacity>

        <View style={$divider} onLayout={(e) => (qaSectionY.current = e.nativeEvent.layout.y)} />
        <Text style={$sectionTitle}>Ask a question</Text>

        <AskQuestionBar
          value={input}
          onChangeText={setInput}
          onSend={handleSend}
          disabled={false}
        />

        <Text style={[$sectionTitle, { marginTop: spacing.s5 }]}>Previous Q&A</Text>

        {qa.isLoading ? (
          <ActivityIndicator
            size="small"
            color={forest500}
            style={{ marginVertical: spacing.s3 }}
          />
        ) : null}

        {qa.isError ? (
          <ApiErrorView error={qa.error} onRetry={() => qa.refetch()} title="Could not load Q&A" />
        ) : null}

        {!qa.isLoading && qa.questions.length === 0 ? (
          <Text style={$emptyQaText}>No questions yet — ask anything about this activity.</Text>
        ) : null}

        {qa.questions.map((question) => (
          <View
            key={question.questionId}
            onLayout={(e) => questionYs.current.set(question.questionId, e.nativeEvent.layout.y)}
          >
            <QuestionBubble
              question={question}
              onRetry={() => qa.retry(question)}
              onFaqPress={handleFaqPress}
            />
          </View>
        ))}

        {qa.questions.length > 0 ? (
          <TouchableOpacity
            style={$viewAllLink}
            activeOpacity={0.7}
            onPress={() => router.push(`/activity/${activityId}/qa` as any)}
          >
            <Text style={$viewAllLinkText}>View all Q&A</Text>
            <Ionicons name="arrow-forward" size={13} color={forest500} />
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
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
const $description: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink2,
  lineHeight: 20,
  marginBottom: spacing.s4,
}
const $metaRow: ViewStyle = {
  flexDirection: "row",
  gap: spacing.s2,
  marginBottom: spacing.s5,
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
const $completeBtn: ViewStyle = {
  backgroundColor: forest500,
  borderRadius: radii.pill,
  paddingVertical: spacing.s4,
  alignItems: "center",
  marginBottom: spacing.s6,
}
const $completeBtnText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 15,
  color: "#FFFFFF",
}
const $divider: ViewStyle = {
  borderTopWidth: 1,
  borderTopColor: hairline,
  marginBottom: spacing.s5,
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
const $emptyQaText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink3,
  marginBottom: spacing.s4,
}
const $viewAllLink: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.s2,
  paddingVertical: spacing.s3,
  marginTop: spacing.s2,
  marginBottom: spacing.s6,
}
const $viewAllLinkText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 13,
  color: forest500,
}
