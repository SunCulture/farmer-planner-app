import { useEffect, useRef, type ReactNode } from "react"
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { KeyboardStickyView } from "react-native-keyboard-controller"

import { AiMarkdown } from "@/components/AiMarkdown"
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
  radii,
  spacing,
  statusGood,
} from "@/theme/tujiweze-tokens"
import { typography } from "@/theme/typography"

export type AiChatMessage = {
  id: string
  role: "user" | "assistant"
  /** Markdown or plain text — assistant replies are rendered as markdown. */
  text: string
  chips?: string[]
}

type AiAssistantPanelProps = {
  title: string
  expanded: boolean
  onToggle: () => void
  messages: AiChatMessage[]
  input: string
  onChangeInput: (value: string) => void
  /** Sends current input, or an explicit follow-up string (e.g. FAQ chip). */
  onSend: (text?: string) => void
  pending?: boolean
  /** When true, composer stays usable while an answer is still pending (activity Q&A). */
  allowSendWhilePending?: boolean
  placeholder?: string
  emptyPrompt?: string
  /** Quick-start chips shown when the thread is empty. */
  starterChips?: string[]
  /** Distance from screen bottom when collapsed/expanded (for floating layouts). */
  bottomOffset?: number
  /** When true, docks above the keyboard. */
  keyboardSticky?: boolean
  /** Optional footer below a message (e.g. plan suggestion cards). */
  renderAfterMessage?: (message: AiChatMessage) => ReactNode
}

/**
 * Reusable expandable AI chat shell used on Plan (and Activity Q&A overlays).
 * Expands toward the full viewport so farmers can read long markdown answers.
 */
export function AiAssistantPanel({
  title,
  expanded,
  onToggle,
  messages,
  input,
  onChangeInput,
  onSend,
  pending = false,
  allowSendWhilePending = false,
  placeholder = "Ask about your farm...",
  emptyPrompt = "Ask me about weather, pests, or whether to adjust today's plan.",
  starterChips,
  bottomOffset = 0,
  keyboardSticky = true,
  renderAfterMessage,
}: AiAssistantPanelProps) {
  const scrollRef = useRef<ScrollView>(null)
  const viewportHeight = Dimensions.get("window").height
  const expandedHeight = Math.min(Math.round(viewportHeight * 0.78), 640)
  const composerLocked = pending && !allowSendWhilePending

  useEffect(() => {
    if (!expanded) return
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
    return () => clearTimeout(t)
  }, [expanded, messages.length, pending])

  const body = (
    <View
      style={[
        $panel,
        expanded && [$panelExpanded, { maxHeight: expandedHeight, height: expandedHeight }],
      ]}
    >
      <TouchableOpacity style={$header} onPress={onToggle} activeOpacity={0.8}>
        <View style={$avatar}>
          <Text style={$avatarText}>AI</Text>
        </View>
        <Text style={$title} numberOfLines={1}>
          {title}
        </Text>
        <View style={$dot} />
        <Ionicons
          name={expanded ? "chevron-down" : "chevron-up"}
          size={18}
          color={ink3}
          style={{ marginLeft: spacing.s2 }}
        />
      </TouchableOpacity>

      {expanded ? (
        <>
          <ScrollView
            ref={scrollRef}
            style={$messages}
            contentContainerStyle={$messagesContent}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={$assistantBubble}>
                <Text style={$emptyText}>{emptyPrompt}</Text>
              </View>
            ) : (
              messages.map((msg) => (
                <View key={msg.id} style={$messageBlock}>
                  <View style={msg.role === "user" ? $userBubble : $assistantBubble}>
                    {msg.role === "assistant" ? (
                      <AiMarkdown>{msg.text}</AiMarkdown>
                    ) : (
                      <Text style={$userText}>{msg.text}</Text>
                    )}
                  </View>

                  {msg.role === "assistant" && msg.chips && msg.chips.length > 0 ? (
                    <View style={$chipRow}>
                      {msg.chips.map((chip) => (
                        <TouchableOpacity
                          key={chip}
                          style={$chip}
                          activeOpacity={0.8}
                          onPress={() => onSend(chip)}
                          disabled={composerLocked}
                        >
                          <Text style={$chipText} numberOfLines={2}>
                            {chip}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}

                  {renderAfterMessage?.(msg)}
                </View>
              ))
            )}

            {messages.length === 0 && starterChips && starterChips.length > 0 ? (
              <View style={$chipRow}>
                {starterChips.map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    style={$chip}
                    activeOpacity={0.8}
                    onPress={() => onSend(chip)}
                    disabled={composerLocked}
                  >
                    <Text style={$chipText} numberOfLines={2}>
                      {chip}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {pending ? (
              <View style={[$assistantBubble, $pendingRow]}>
                <ActivityIndicator size="small" color={forest500} />
                <Text style={$emptyText}>Thinking…</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={$inputRow}>
            <TextInput
              style={$input}
              value={input}
              onChangeText={onChangeInput}
              placeholder={placeholder}
              placeholderTextColor={ink4}
              returnKeyType="send"
              onSubmitEditing={() => onSend()}
              multiline
              editable={!composerLocked}
            />
            <TouchableOpacity
              style={[$sendBtn, (!input.trim() || composerLocked) && $sendBtnDisabled]}
              onPress={() => onSend()}
              disabled={!input.trim() || composerLocked}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Send"
            >
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </View>
  )

  if (!keyboardSticky) {
    return <View style={[$dock, { bottom: bottomOffset }]}>{body}</View>
  }

  return (
    <KeyboardStickyView
      style={[$dock, { bottom: bottomOffset }]}
      offset={{ closed: 0, opened: -bottomOffset }}
      enabled={expanded}
    >
      {body}
    </KeyboardStickyView>
  )
}

export default AiAssistantPanel

const $dock: ViewStyle = {
  position: "absolute",
  left: spacing.s4,
  right: spacing.s4,
}

const $panel: ViewStyle = {
  backgroundColor: card,
  borderRadius: radii.xl,
  borderWidth: 1,
  borderColor: cardBorder,
  ...elevation.card,
  overflow: "hidden",
}

const $panelExpanded: ViewStyle = {}

const $header: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.s4,
  paddingVertical: spacing.s3,
}

const $avatar: ViewStyle = {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: forest50,
  alignItems: "center",
  justifyContent: "center",
  marginRight: spacing.s3,
}

const $avatarText: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 11,
  color: forest500,
  letterSpacing: 0.7,
}

const $title: TextStyle = {
  flex: 1,
  fontFamily: typography.primary.semiBold,
  fontSize: 14,
  color: ink,
}

const $dot: ViewStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: statusGood,
}

const $messages: ViewStyle = {
  flex: 1,
}

const $messagesContent: ViewStyle = {
  paddingHorizontal: spacing.s4,
  paddingBottom: spacing.s2,
  gap: spacing.s2,
}

const $messageBlock: ViewStyle = {
  gap: spacing.s2,
  marginBottom: spacing.s2,
}

const $assistantBubble: ViewStyle = {
  backgroundColor: forest50,
  borderRadius: radii.lg,
  padding: spacing.s3,
  alignSelf: "stretch",
  width: "100%",
}

const $userBubble: ViewStyle = {
  backgroundColor: hairline,
  borderRadius: radii.lg,
  padding: spacing.s3,
  alignSelf: "flex-end",
  maxWidth: "88%",
}

const $userText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: ink,
  lineHeight: 20,
}

const $emptyText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink2,
  lineHeight: 18,
}

const $pendingRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
}

const $chipRow: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.s2,
}

const $chip: ViewStyle = {
  backgroundColor: forest50,
  borderRadius: radii.pill,
  paddingHorizontal: spacing.s3,
  paddingVertical: spacing.s2,
  borderWidth: 1,
  borderColor: hairline,
  maxWidth: "100%",
}

const $chipText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: ink2,
}

const $inputRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-end",
  gap: spacing.s2,
  paddingHorizontal: spacing.s3,
  paddingBottom: spacing.s3,
  paddingTop: spacing.s2,
  borderTopWidth: 1,
  borderTopColor: hairline,
}

const $input: TextStyle = {
  flex: 1,
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink,
  backgroundColor: hairline,
  borderRadius: radii.lg,
  paddingHorizontal: spacing.s4,
  paddingVertical: spacing.s3,
  maxHeight: 100,
}

const $sendBtn: ViewStyle = {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: forest500,
  alignItems: "center",
  justifyContent: "center",
}

const $sendBtnDisabled: ViewStyle = { opacity: 0.4 }
