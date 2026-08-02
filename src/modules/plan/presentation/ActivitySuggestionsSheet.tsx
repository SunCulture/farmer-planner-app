import { useRef } from "react"
import {
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Text } from "@/components/Text"
import {
  card,
  forest50,
  forest500,
  hairline,
  ink,
  ink2,
  ink3,
  ink4,
  radii,
  spacing,
  statusGood,
  statusGoodBg,
} from "@/theme/tujiweze-tokens"
import { typography } from "@/theme/typography"

import { useAcceptSuggestion } from "../application/use-accept-suggestion"
import { useActivitySuggestions } from "../application/use-activity-suggestions"
import { useActivitySuggestionsSheet } from "../application/use-activity-suggestions-sheet"
import { useDismissSuggestion } from "../application/use-dismiss-suggestion"
import type { ActivitySuggestion } from "../domain/entities/activity-suggestion"

const SWIPE_DOWN_CLOSE_THRESHOLD = 90

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function suggestionMeta(s: ActivitySuggestion): string | undefined {
  const parts: string[] = []
  if (s.estimatedMinutes) parts.push(`${s.estimatedMinutes} min`)
  if (s.timeOfDay) parts.push(capitalize(s.timeOfDay))
  return parts.length > 0 ? parts.join(" · ") : undefined
}

/**
 * Non-blocking, dismissible, revisitable bottom sheet showing pending AI
 * activity suggestions for a single date. Opened either by the SSE
 * `activity_queue_updated` event or by the persistent banner — both paths
 * converge on `useActivitySuggestionsSheet`'s `date`, and this component
 * always fetches the canonical list via `GET /me/activity-suggestions` so
 * it renders correctly regardless of entry point.
 */
export function ActivitySuggestionsSheet() {
  const insets = useSafeAreaInsets()
  const { isOpen, date, close } = useActivitySuggestionsSheet()
  const { data: suggestions, isLoading } = useActivitySuggestions(isOpen ? date : null)

  const translateY = useRef(new Animated.Value(0)).current
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) => gesture.dy > 4,
      onPanResponderMove: (_evt, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy)
      },
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dy > SWIPE_DOWN_CLOSE_THRESHOLD) {
          close()
        }
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start()
      },
    }),
  ).current

  const list = suggestions ?? []

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={close}>
      <View style={$backdrop}>
        <Pressable style={$backdropTouchable} onPress={close} accessibilityLabel="Close" />
        <Animated.View
          style={[
            $sheet,
            { paddingBottom: insets.bottom + spacing.s4 },
            { transform: [{ translateY }] },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={$dragHandle} />
          <Text style={$title}>AI has suggestions for your plan</Text>
          <Text style={$subtitle}>Based on your feedback today</Text>

          {isLoading ? (
            <View style={$loadingRow}>
              <ActivityIndicator color={forest500} />
            </View>
          ) : list.length === 0 ? (
            <Text style={$emptyText}>No suggestions to review right now.</Text>
          ) : (
            list.map((suggestion) => <SuggestionCard key={suggestion.id} suggestion={suggestion} />)
          )}

          <TouchableOpacity style={$doneBtn} onPress={close} activeOpacity={0.85}>
            <Text style={$doneBtnText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  )
}

function SuggestionCard({ suggestion }: { suggestion: ActivitySuggestion }) {
  const acceptSuggestion = useAcceptSuggestion()
  const dismissSuggestion = useDismissSuggestion()

  const isAccepting = acceptSuggestion.isPending && acceptSuggestion.variables === suggestion.id
  const justAccepted = acceptSuggestion.isSuccess && acceptSuggestion.variables === suggestion.id
  const isDismissing =
    dismissSuggestion.isPending && dismissSuggestion.variables?.id === suggestion.id
  const meta = suggestionMeta(suggestion)

  if (justAccepted) {
    return (
      <View style={[$card, $cardSuccess]}>
        <Ionicons name="checkmark-circle" size={20} color={statusGood} />
        <Text style={$successText}>Added to plan</Text>
      </View>
    )
  }

  return (
    <View style={$card}>
      <Text style={$cardTitle}>{suggestion.title}</Text>
      {meta ? <Text style={$cardMeta}>{meta}</Text> : null}
      {suggestion.description ? (
        <Text style={$cardDescription} numberOfLines={2}>
          {suggestion.description}
        </Text>
      ) : null}

      <View style={$cardActions}>
        <TouchableOpacity
          style={[$addBtn, isAccepting && $btnDisabled]}
          onPress={() => acceptSuggestion.mutate(suggestion.id)}
          disabled={isAccepting || isDismissing}
          activeOpacity={0.85}
        >
          {isAccepting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={$addBtnText}>Add to plan</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[$skipBtn, isDismissing && $btnDisabled]}
          onPress={() =>
            dismissSuggestion.mutate({ id: suggestion.id, date: suggestion.suggestedForDate })
          }
          disabled={isAccepting || isDismissing}
          activeOpacity={0.85}
        >
          <Text style={$skipBtnText}>Not for me</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default ActivitySuggestionsSheet

const $backdrop: ViewStyle = {
  flex: 1,
  justifyContent: "flex-end",
  backgroundColor: "rgba(31,28,24,0.4)",
}
const $backdropTouchable: ViewStyle = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }
const $sheet: ViewStyle = {
  backgroundColor: card,
  borderTopLeftRadius: radii.xl,
  borderTopRightRadius: radii.xl,
  paddingHorizontal: spacing.s5,
  paddingTop: spacing.s3,
  maxHeight: "80%",
}
const $dragHandle: ViewStyle = {
  width: 40,
  height: 4,
  borderRadius: radii.pill,
  backgroundColor: hairline,
  alignSelf: "center",
  marginBottom: spacing.s4,
}
const $title: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 17,
  color: ink,
  marginBottom: spacing.s1,
}
const $subtitle: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink3,
  marginBottom: spacing.s4,
}
const $loadingRow: ViewStyle = { paddingVertical: spacing.s5, alignItems: "center" }
const $emptyText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink3,
  paddingVertical: spacing.s4,
  textAlign: "center",
}
const $card: ViewStyle = {
  backgroundColor: forest50,
  borderRadius: radii.lg,
  borderWidth: 1,
  borderColor: hairline,
  padding: spacing.s4,
  marginBottom: spacing.s3,
}
const $cardSuccess: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
  backgroundColor: statusGoodBg,
  borderColor: statusGood,
}
const $successText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 14,
  color: ink,
}
const $cardTitle: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 15,
  color: ink,
  marginBottom: 2,
}
const $cardMeta: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: ink3,
  marginBottom: spacing.s2,
}
const $cardDescription: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink2,
  lineHeight: 18,
  marginBottom: spacing.s3,
}
const $cardActions: ViewStyle = { flexDirection: "row", gap: spacing.s2 }
const $addBtn: ViewStyle = {
  flex: 1,
  backgroundColor: forest500,
  borderRadius: radii.pill,
  paddingVertical: spacing.s3,
  alignItems: "center",
  justifyContent: "center",
}
const $addBtnText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 13,
  color: "#FFFFFF",
}
const $skipBtn: ViewStyle = {
  flex: 1,
  backgroundColor: card,
  borderRadius: radii.pill,
  borderWidth: 1,
  borderColor: hairline,
  paddingVertical: spacing.s3,
  alignItems: "center",
  justifyContent: "center",
}
const $skipBtnText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 13,
  color: ink3,
}
const $btnDisabled: ViewStyle = { opacity: 0.6 }
const $doneBtn: ViewStyle = {
  alignSelf: "center",
  paddingHorizontal: spacing.s6,
  paddingVertical: spacing.s3,
  marginTop: spacing.s2,
}
const $doneBtnText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 14,
  color: ink4,
}
