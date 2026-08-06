import React, { useRef, useState } from "react"
import {
  ActivityIndicator,
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
import { forest500, hairline, ink, ink3, paper, spacing } from "@/theme/tujiweze-tokens"
import { typography } from "@/theme/typography"

import { useActivityQA } from "../application/use-activity-qa"
import { AskQuestionBar } from "./components/AskQuestionBar"
import { QuestionBubble } from "./components/QuestionBubble"

/** Full Q&A list for a single activity, linked to from "View all Q&A". */
export default function ActivityQAListScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const activityId = typeof id === "string" ? id : ""
  const [input, setInput] = useState("")
  const scrollRef = useRef<ScrollView>(null)

  const qa = useActivityQA(activityId)

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setInput("")
    try {
      await qa.ask(trimmed)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)
    } catch {
      setInput(trimmed)
    }
  }

  return (
    <View style={$root}>
      <View style={[$header, { paddingTop: insets.top + spacing.s2 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={$backBtn}>
          <Ionicons name="arrow-back" size={22} color={ink} />
        </TouchableOpacity>
        <Text style={$headerTitle}>All questions</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={$scroll}
        contentContainerStyle={[$scrollContent, { paddingBottom: spacing.s10 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {qa.isLoading ? (
          <ActivityIndicator size="large" color={forest500} style={{ marginTop: spacing.s8 }} />
        ) : null}

        {qa.isError ? (
          <ApiErrorView error={qa.error} onRetry={() => qa.refetch()} title="Could not load Q&A" />
        ) : null}

        {!qa.isLoading && qa.questions.length === 0 ? (
          <Text style={$emptyText}>No questions asked for this activity yet.</Text>
        ) : null}

        {qa.questions.map((question, index) => (
          <QuestionBubble
            key={question.questionId || `qa-${index}`}
            question={question}
            onRetry={() => qa.retry(question)}
            onFaqPress={(faq) => send(faq)}
          />
        ))}
      </ScrollView>

      <View style={[$composer, { paddingBottom: insets.bottom + spacing.s3 }]}>
        <AskQuestionBar
          value={input}
          onChangeText={setInput}
          onSend={() => send(input)}
          disabled={qa.isAsking}
        />
      </View>
    </View>
  )
}

const $root: ViewStyle = { flex: 1, backgroundColor: paper }
const $scroll: ViewStyle = { flex: 1, backgroundColor: paper }
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
const $scrollContent: ViewStyle = { paddingHorizontal: spacing.s5, paddingTop: spacing.s4 }
const $emptyText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink3,
  textAlign: "center",
  marginTop: spacing.s8,
}
const $composer: ViewStyle = {
  paddingHorizontal: spacing.s5,
  paddingTop: spacing.s3,
  backgroundColor: paper,
  borderTopWidth: 1,
  borderTopColor: hairline,
}
