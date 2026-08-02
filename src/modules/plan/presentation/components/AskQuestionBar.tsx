import { TextInput, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"

import { forest500, hairline, ink, ink4, radii, spacing } from "@/theme/tujiweze-tokens"
import { typography } from "@/theme/typography"

interface AskQuestionBarProps {
  value: string
  onChangeText: (text: string) => void
  onSend: () => void
  /** Input stays enabled while a question is pending so another can be asked. */
  disabled?: boolean
}

export function AskQuestionBar({ value, onChangeText, onSend, disabled }: AskQuestionBarProps) {
  return (
    <View style={$row}>
      <TextInput
        style={$input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Ask anything about this activity..."
        placeholderTextColor={ink4}
        returnKeyType="send"
        onSubmitEditing={onSend}
        multiline
      />
      <TouchableOpacity
        style={[$sendBtn, (!value.trim() || disabled) && $sendBtnDisabled]}
        onPress={onSend}
        disabled={!value.trim() || disabled}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Send question"
      >
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  )
}

export default AskQuestionBar

const $row: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-end",
  gap: spacing.s2,
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
