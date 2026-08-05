import { ActivityIndicator, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"

import {
  card,
  cardBorder,
  forest50,
  forest500,
  hairline,
  ink,
  ink2,
  ink3,
  radii,
  spacing,
  statusBad,
  statusBadBg,
} from "@/theme/tapp-tokens"
import { typography } from "@/theme/typography"

import type { ActivityQuestion } from "../../domain/entities/activity-qa"

interface QuestionBubbleProps {
  question: ActivityQuestion
  onRetry: () => void
  onFaqPress: (faqQuestion: string) => void
}

/**
 * Renders one Q&A entry: the farmer's question, then either a pending
 * spinner, the AI answer (+ related FAQ chips), or a failed state with a
 * "Try again" affordance that re-POSTs the same question text.
 *
 * The backend answer is one-shot markdown, not token-by-token — no
 * markdown renderer is wired into this project yet, so the answer text is
 * shown as plain text (see PR notes for the judgment call).
 */
export function QuestionBubble({ question, onRetry, onFaqPress }: QuestionBubbleProps) {
  return (
    <View style={$container}>
      <View style={$questionBubble}>
        <Text style={$questionText}>{question.question}</Text>
      </View>

      {question.status === "pending" ? (
        <View style={[$answerBubble, $answerBubbleRow]}>
          <ActivityIndicator size="small" color={forest500} />
          <Text style={$pendingText}>Thinking…</Text>
        </View>
      ) : null}

      {question.status === "failed" ? (
        <View style={$failedBubble}>
          <Text style={$failedText}>Couldn&apos;t get an answer. Please try again.</Text>
          <TouchableOpacity style={$retryBtn} onPress={onRetry} activeOpacity={0.8}>
            <Ionicons name="refresh" size={13} color={forest500} />
            <Text style={$retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {question.status === "answered" ? (
        <View style={$answerBubble}>
          <Text style={$answerText}>{question.answer}</Text>
          {question.relatedFaqs.length > 0 ? (
            <View style={$faqRow}>
              {question.relatedFaqs.map((faq) => (
                <TouchableOpacity
                  key={faq.question}
                  style={$faqChip}
                  onPress={() => onFaqPress(faq.question)}
                  activeOpacity={0.8}
                >
                  <Text style={$faqChipText} numberOfLines={1}>
                    {faq.question}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

export default QuestionBubble

const $container: ViewStyle = { marginBottom: spacing.s4 }
const $questionBubble: ViewStyle = {
  alignSelf: "flex-end",
  backgroundColor: hairline,
  borderRadius: radii.lg,
  borderBottomRightRadius: radii.xs,
  paddingHorizontal: spacing.s3,
  paddingVertical: spacing.s2,
  marginBottom: spacing.s2,
  maxWidth: "88%",
}
const $questionText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: ink,
  lineHeight: 18,
}
const $answerBubble: ViewStyle = {
  backgroundColor: card,
  borderWidth: 1,
  borderColor: cardBorder,
  borderRadius: radii.lg,
  borderBottomLeftRadius: radii.xs,
  padding: spacing.s3,
  maxWidth: "92%",
}
const $answerBubbleRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
}
const $pendingText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink3,
}
const $answerText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink2,
  lineHeight: 19,
}
const $failedBubble: ViewStyle = {
  backgroundColor: statusBadBg,
  borderRadius: radii.lg,
  borderBottomLeftRadius: radii.xs,
  padding: spacing.s3,
  maxWidth: "92%",
}
const $failedText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: statusBad,
  marginBottom: spacing.s2,
}
const $retryBtn: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s1,
  alignSelf: "flex-start",
}
const $retryText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 12,
  color: forest500,
}
const $faqRow: ViewStyle = {
  width: "100%",
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.s2,
  marginTop: spacing.s3,
}
const $faqChip: ViewStyle = {
  backgroundColor: forest50,
  borderRadius: radii.pill,
  borderWidth: 1,
  borderColor: hairline,
  paddingHorizontal: spacing.s3,
  paddingVertical: spacing.s2,
  maxWidth: "100%",
}
const $faqChipText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: ink2,
}
