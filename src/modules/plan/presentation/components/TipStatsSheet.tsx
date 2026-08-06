import { Modal, Pressable, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { card, forest500, ink, ink2, ink3, paper, radii, spacing } from "@/theme/tujiweze-tokens"
import { typography } from "@/theme/typography"

import { useTipSession } from "../../application/use-tip-session"
import type { EducationRating } from "../../domain/entities/education-course"
import type { EducationTipSession } from "../../domain/entities/education-tip-session"

type Props = {
  visible: boolean
  onClose: () => void
  activityId: string
  /** Local or server rating for this tip course. */
  rating?: EducationRating | null
  hasCompleted?: boolean
  serverCompletedCount?: number
  /**
   * `modal` — standalone bottom sheet (Activity Detail).
   * `overlay` — in-screen sheet when already inside the Tips modal (avoids nested Modals).
   */
  presentation?: "modal" | "overlay"
}

function feedbackLabel(
  rating: EducationRating | null | undefined,
  hasCompleted: boolean,
): string {
  if (rating === "helpful") return "Helpful"
  if (rating === "not_helpful") return "Not helpful"
  if (hasCompleted) return "Read (not rated)"
  return "Not rated yet"
}

function closeKindLabel(session: EducationTipSession): string {
  if (session.lastCloseKind === "full") return "Full run"
  if (session.lastCloseKind === "partial") return "Left mid-way"
  return "—"
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatCount(value: number | null | undefined): string {
  return String(value ?? 0)
}

function StatRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[$row, isLast && $rowLast]}>
      <Text style={$rowLabel}>{label}</Text>
      <Text style={$rowValue}>{value}</Text>
    </View>
  )
}

function TipStatsBody({
  activityId,
  rating,
  hasCompleted,
  serverCompletedCount,
  onClose,
}: {
  activityId: string
  rating: EducationRating | null | undefined
  hasCompleted: boolean
  serverCompletedCount: number
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()
  const session = useTipSession(activityId)
  const completed = hasCompleted || serverCompletedCount > 0
  const hasLocalActivity = (session.openCount ?? 0) > 0 || (session.closeCount ?? 0) > 0

  const rows: { label: string; value: string }[] = [
    { label: "Opened", value: formatCount(session.openCount) },
    { label: "Closed", value: formatCount(session.closeCount) },
    { label: "Full runs", value: formatCount(session.fullRunCount) },
    { label: "Left mid-way", value: formatCount(session.partialExitCount) },
    { label: "Last exit", value: closeKindLabel(session) },
    { label: "Feedback", value: feedbackLabel(rating, completed) },
  ]
  if ((serverCompletedCount ?? 0) > 0) {
    rows.push({ label: "Server completions", value: formatCount(serverCompletedCount) })
  }
  rows.push(
    { label: "Last opened", value: formatWhen(session.lastOpenedAt) },
    { label: "Last closed", value: formatWhen(session.lastClosedAt) },
  )

  return (
    <Pressable
      style={[$sheet, { paddingBottom: insets.bottom + spacing.s4 }]}
      onPress={(e) => e.stopPropagation()}
    >
      <View style={$handle} />
      <Text style={$title}>Tip stats</Text>
      <Text style={$subtitle}>
        {hasLocalActivity
          ? "Local engagement for this activity’s tips."
          : "No tip engagement yet — open the tips to start tracking."}
      </Text>

      <View style={$card}>
        {rows.map((row, i) => (
          <StatRow key={row.label} label={row.label} value={row.value} isLast={i === rows.length - 1} />
        ))}
      </View>

      <TouchableOpacity style={$doneBtn} onPress={onClose} activeOpacity={0.85}>
        <Text style={$doneBtnText}>Done</Text>
      </TouchableOpacity>
    </Pressable>
  )
}

export function TipStatsSheet({
  visible,
  onClose,
  activityId,
  rating = null,
  hasCompleted = false,
  serverCompletedCount = 0,
  presentation = "modal",
}: Props) {
  if (!visible) return null

  const body = (
    <TipStatsBody
      activityId={activityId}
      rating={rating}
      hasCompleted={hasCompleted}
      serverCompletedCount={serverCompletedCount}
      onClose={onClose}
    />
  )

  if (presentation === "overlay") {
    return (
      <Pressable style={$overlay} onPress={onClose}>
        {body}
      </Pressable>
    )
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={$backdrop} onPress={onClose}>
        {body}
      </Pressable>
    </Modal>
  )
}

const $backdrop: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(28, 25, 23, 0.4)",
  justifyContent: "flex-end",
}
const $overlay: ViewStyle = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: "rgba(28, 25, 23, 0.4)",
  justifyContent: "flex-end",
  zIndex: 20,
}
const $sheet: ViewStyle = {
  backgroundColor: paper,
  borderTopLeftRadius: radii.xl,
  borderTopRightRadius: radii.xl,
  paddingHorizontal: spacing.s5,
  paddingTop: spacing.s3,
}
const $handle: ViewStyle = {
  alignSelf: "center",
  width: 36,
  height: 4,
  borderRadius: 2,
  backgroundColor: "#D9D2C8",
  marginBottom: spacing.s4,
}
const $title: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: ink,
  marginBottom: spacing.s1,
}
const $subtitle: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink3,
  marginBottom: spacing.s4,
}
const $card: ViewStyle = {
  backgroundColor: card,
  borderRadius: radii.lg,
  paddingHorizontal: spacing.s4,
  paddingVertical: spacing.s2,
  borderWidth: 1,
  borderColor: "rgba(196, 185, 172, 0.45)",
  marginBottom: spacing.s5,
}
const $row: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: spacing.s3,
  paddingVertical: spacing.s3,
  borderBottomWidth: 1,
  borderBottomColor: "rgba(196, 185, 172, 0.35)",
}
const $rowLast: ViewStyle = {
  borderBottomWidth: 0,
}
const $rowLabel: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink2,
  flexShrink: 1,
}
const $rowValue: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 14,
  color: ink,
  textAlign: "right",
}
const $doneBtn: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: forest500,
  borderRadius: radii.pill,
  minHeight: 48,
  paddingHorizontal: spacing.s6,
}
const $doneBtnText: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 15,
  color: "#FFFFFF",
}
