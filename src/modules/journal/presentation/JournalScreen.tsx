import React, { useCallback, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
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
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { useQueryClient } from "@tanstack/react-query"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { FLOATING_NAV_CLEARANCE } from "@/app/(tabs)/_layout"
import { ApiErrorView } from "@/components/ApiErrorView"
import { getApiErrorMessage } from "@/shared/infrastructure/api-error"
import { plannerKeys } from "@/shared/query-keys"
import {
  card,
  cardBorder,
  elevation,
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
  paper2,
  radii,
  spacing,
  statusGoodBg,
} from "@/theme/tapp-tokens"
import { typography } from "@/theme/typography"

import {
  buildTimelineDates,
  todayStr,
  useJournalTimeline,
} from "../application/use-journal-timeline"
import { useSubmitCompletion } from "../application/use-submit-completion"
import type { DayCompletionActivity, DaySummary } from "../domain/entities/completion"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dateStrDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function formatLongDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

function formatDayLabel(dateStr: string, today: string): string {
  const yesterday = dateStrDaysAgo(1)
  if (dateStr === today) return "Today"
  if (dateStr === yesterday) return "Yesterday"
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    .toUpperCase()
}

// ---------------------------------------------------------------------------
// Route entry point — mode switch
// ---------------------------------------------------------------------------

export default function JournalScreen() {
  const params = useLocalSearchParams<{
    date?: string
    activityId?: string
    activityName?: string
    activityIcon?: string
    mode?: string
  }>()

  const isEntryMode = params.mode === "new" || Boolean(params.activityId && params.activityName)

  if (isEntryMode) {
    return (
      <EntryForm
        date={params.date ?? todayStr()}
        activityId={params.activityId}
        activityName={params.activityName}
        activityIcon={params.activityIcon}
      />
    )
  }

  return <JournalTimeline />
}

// ---------------------------------------------------------------------------
// EntryForm — works for both standalone ("New Entry") and activity-linked
// ---------------------------------------------------------------------------

function EntryForm({
  date,
  activityId,
  activityName,
  activityIcon,
}: {
  date: string
  activityId?: string
  activityName?: string
  activityIcon?: string
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const submitCompletion = useSubmitCompletion()

  const [notes, setNotes] = useState("")
  const [photoUris, setPhotoUris] = useState<string[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)

  const isActivityLinked = Boolean(activityId && activityName)
  const canVerify = notes.trim().length >= 20 && photoUris.length >= 1

  async function handlePhoto(source: "camera" | "gallery") {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow camera or photo access to attach farm photos.")
      return
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false })
        : await ImagePicker.launchImageLibraryAsync({
            quality: 0.8,
            allowsMultipleSelection: true,
            selectionLimit: 5 - photoUris.length,
          })

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUris((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5))
    }
  }

  async function handleSave() {
    if (!notes.trim()) return
    if (!activityId) {
      Alert.alert("Activity required", "Link this entry to an activity from Home or Plan.")
      return
    }

    setSaveError(null)
    try {
      await submitCompletion.mutateAsync({
        activityId,
        journalText: notes.trim(),
        photoUris,
      })
      router.back()
    } catch (err) {
      setSaveError(getApiErrorMessage(err))
    }
  }

  return (
    <KeyboardAvoidingView
      style={$root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          $scroll,
          { paddingTop: insets.top + spacing.s4, paddingBottom: FLOATING_NAV_CLEARANCE + spacing.s4 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Nav header ── */}
        <View style={$navHeader}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={$backBtn}>
            <Ionicons name="arrow-back" size={22} color={ink} />
          </TouchableOpacity>
          <Text style={$navLabel}>FARMING JOURNAL</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* ── Context: activity card OR date label ── */}
        {isActivityLinked ? (
          <View style={$activityCtxCard}>
            <View style={$activityCtxIconCircle}>
              <Text style={$activityCtxIcon}>{activityIcon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={$activityCtxName}>{activityName}</Text>
              <Text style={$activityCtxDate}>{formatLongDate(date)}</Text>
            </View>
            <View style={$journalBadge}>
              <Text style={$journalBadgeText}>Journalling</Text>
            </View>
          </View>
        ) : (
          <View style={$dateCtxRow}>
            <Ionicons name="calendar-outline" size={16} color={forest500} />
            <Text style={$dateCtxText}>{formatLongDate(date)}</Text>
          </View>
        )}

        {/* ── Photo upload ── */}
        <Text style={$sectionLabel}>Upload Farm Photo</Text>
        <Text style={$verifyHint}>
          Add a photo and 20+ characters to get verified completion status.
        </Text>
        <View style={$photoRow}>
          <TouchableOpacity
            style={[$photoBtn, $photoBtnSolid, photoUris.length > 0 && $photoBtnSet]}
            onPress={() => handlePhoto("camera")}
            activeOpacity={0.8}
            disabled={photoUris.length >= 5}
          >
            <Ionicons
              name={photoUris.length > 0 ? "camera" : "camera-outline"}
              size={24}
              color={photoUris.length > 0 ? forest600 : forest500}
            />
            <Text style={[$photoBtnLabel, photoUris.length > 0 && $photoBtnLabelSet]}>Take Photo</Text>
            <Text style={$photoBtnSub}>
              {photoUris.length > 0 ? `${photoUris.length} attached` : "Use your camera"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[$photoBtn, $photoBtnDashed]}
            onPress={() => handlePhoto("gallery")}
            activeOpacity={0.8}
            disabled={photoUris.length >= 5}
          >
            <Ionicons name="images-outline" size={24} color={ink3} />
            <Text style={$photoBtnLabel}>From Gallery</Text>
            <Text style={$photoBtnSub}>Browse your photos</Text>
          </TouchableOpacity>
        </View>

        {canVerify ? (
          <Text style={$verifyReady}>Ready for verification ✓</Text>
        ) : null}

        {saveError ? <Text style={$saveError}>{saveError}</Text> : null}

        {/* ── Notes ── */}
        <Text style={$sectionLabel}>
          {isActivityLinked ? "How did it go?" : "What did you do today?"}
        </Text>
        <TextInput
          style={$textarea}
          value={notes}
          onChangeText={setNotes}
          placeholder={
            isActivityLinked
              ? "Write about this activity... What went well? Any challenges?"
              : "Write your notes... What did you do? What went well? Any challenges?"
          }
          placeholderTextColor={ink4}
          multiline
          textAlignVertical="top"
        />

        {/* ── Actions ── */}
        <View style={$actionRow}>
          <TouchableOpacity style={$voiceBtn} activeOpacity={0.8}>
            <Ionicons name="mic-outline" size={18} color={ink2} />
            <Text style={$voiceBtnLabel}>Voice Note</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[$saveBtn, (!notes.trim() || submitCompletion.isPending) && $saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={!notes.trim() || submitCompletion.isPending}
          >
            {submitCompletion.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={$saveBtnLabel}>Save Entry</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ---------------------------------------------------------------------------
// JournalTimeline — grouped by day; default tab view
// ---------------------------------------------------------------------------

function JournalTimeline() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const queryClient = useQueryClient()
  const today = todayStr()

  const dates = useMemo(() => buildTimelineDates(), [])
  const { timeline, isLoading, error: hasError } = useJournalTimeline(dates)

  useFocusEffect(
    useCallback(() => {
      dates.forEach((date) => {
        queryClient.invalidateQueries({ queryKey: plannerKeys.dayCompletions(date) })
      })
    }, [queryClient, dates]),
  )

  const daysWithContent = useMemo(
    () => timeline.filter((d) => d.activities.length > 0),
    [timeline],
  )

  return (
    <View style={$root}>
      <ScrollView
        contentContainerStyle={[
          $scroll,
          { paddingTop: insets.top + spacing.s5, paddingBottom: FLOATING_NAV_CLEARANCE + spacing.s6 + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={$screenLabel}>FARMING JOURNAL</Text>
        <Text style={$screenTitle}>My Journal</Text>

        {isLoading && daysWithContent.length === 0 ? (
          <ActivityIndicator size="large" color={forest500} style={{ marginTop: spacing.s6 }} />
        ) : hasError && daysWithContent.length === 0 ? (
          <ApiErrorView error={hasError} title="Could not load journal" />
        ) : daysWithContent.length === 0 ? (
          <View style={$emptyState}>
            <Text style={$emptyStateText}>
              No entries yet.{"\n"}Tap an activity on Home or Plan to start journalling.
            </Text>
          </View>
        ) : (
          daysWithContent.map((day, i) => (
            <TimelineDay
              key={day.date}
              day={day}
              today={today}
              isLast={i === daysWithContent.length - 1}
            />
          ))
        )}
      </ScrollView>

      {/* ── FAB: Add journal entry ── */}
      <TouchableOpacity
        style={[$fab, { bottom: insets.bottom + FLOATING_NAV_CLEARANCE + spacing.s2 }]}
        onPress={() =>
          router.push({ pathname: "/(tabs)/journal", params: { mode: "new", date: today } })
        }
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={$fabLabel}>New Entry</Text>
      </TouchableOpacity>
    </View>
  )
}

// ---------------------------------------------------------------------------
// TimelineDay
// ---------------------------------------------------------------------------

function TimelineDay({
  day,
  today,
  isLast,
}: {
  day: DaySummary
  today: string
  isLast: boolean
}) {
  const label = formatDayLabel(day.date, today)
  const isToday = day.date === today

  return (
    <View style={$timelineItem}>
      {/* Day header */}
      <View style={$dayHeaderRow}>
        <View style={[$dayDot, isToday && $dayDotToday]} />
        <View style={$dayHeaderLine} />
        <Text style={[$dayLabel, isToday && $dayLabelToday]}>{label}</Text>
        <View style={$dayHeaderLine} />
      </View>

      {day.activities.length === 0 && isToday ? (
        <View style={$emptyDayCard}>
          <Text style={$emptyDayText}>No entries yet today.</Text>
        </View>
      ) : null}

      {day.activities.map((activity) => (
        <CompletionCard key={activity.id} activity={activity} />
      ))}

      {!isLast && <View style={$connectorLine} />}
    </View>
  )
}

// ---------------------------------------------------------------------------
// EntryCard — richer view with notes, photos, AI summary
// ---------------------------------------------------------------------------

function CompletionCard({ activity }: { activity: DayCompletionActivity }) {
  const completion = activity.completion
  if (!completion) return null

  const photoCount = completion.photoUrls.length

  return (
    <View style={$entryCard}>
      <View style={$entryActivityRow}>
        <Text style={$entryActivityName}>{activity.title}</Text>
        <View style={$statusPill}>
          <Text style={$statusPillText}>{activity.status.label}</Text>
        </View>
      </View>

      <Text style={$entrySectionHeader}>What I did</Text>
      <Text style={$entryNotes}>&ldquo;{completion.journalText}&rdquo;</Text>

      <View style={$entryDivider} />

      <View style={$entryMetaRow}>
        <View style={$entryMetaLeft}>
          <Ionicons name="camera-outline" size={15} color={ink3} />
          <Text style={$entryMetaLabel}>
            {photoCount > 0 ? `${photoCount} photo${photoCount !== 1 ? "s" : ""}` : "No photos"}
          </Text>
        </View>
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Styles — shared
// ---------------------------------------------------------------------------

const $root: ViewStyle = { flex: 1, backgroundColor: paper }
const $scroll: ViewStyle = { paddingHorizontal: spacing.s5 }

// ---------------------------------------------------------------------------
// Styles — EntryForm
// ---------------------------------------------------------------------------

const $navHeader: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: spacing.s5,
}

const $backBtn: ViewStyle = {
  width: 38,
  height: 38,
  borderRadius: 19,
  backgroundColor: card,
  borderWidth: 1,
  borderColor: hairline,
  alignItems: "center",
  justifyContent: "center",
  ...elevation.card,
}

const $navLabel: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 11,
  color: forest500,
  letterSpacing: 1.2,
  textTransform: "uppercase",
}

const $activityCtxCard: ViewStyle = {
  backgroundColor: card,
  borderRadius: radii.xl,
  borderWidth: 1,
  borderColor: cardBorder,
  flexDirection: "row",
  alignItems: "center",
  padding: spacing.s4,
  gap: spacing.s3,
  marginBottom: spacing.s5,
  ...elevation.card,
}

const $activityCtxIconCircle: ViewStyle = {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: forest50,
  alignItems: "center",
  justifyContent: "center",
}

const $activityCtxIcon: TextStyle = { fontSize: 22 }

const $activityCtxName: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 15,
  color: ink,
  lineHeight: 20,
}

const $activityCtxDate: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: ink3,
  marginTop: 2,
}

const $journalBadge: ViewStyle = {
  backgroundColor: forest50,
  borderRadius: radii.pill,
  paddingHorizontal: spacing.s3,
  paddingVertical: 4,
}

const $journalBadgeText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 11,
  color: forest600,
}

const $dateCtxRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
  marginBottom: spacing.s5,
  paddingHorizontal: spacing.s1,
}

const $dateCtxText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: forest500,
}

const $sectionLabel: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 15,
  color: ink,
  marginBottom: spacing.s2,
}

const $verifyHint: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 12,
  color: ink3,
  marginBottom: spacing.s3,
  lineHeight: 17,
}

const $verifyReady: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: forest600,
  marginBottom: spacing.s3,
}

const $saveError: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: "#C0392B",
  marginBottom: spacing.s3,
}

const $photoRow: ViewStyle = {
  flexDirection: "row",
  gap: spacing.s3,
  marginBottom: spacing.s5,
}

const $photoBtn: ViewStyle = {
  flex: 1,
  borderRadius: radii.xl,
  paddingVertical: spacing.s4,
  alignItems: "center",
  gap: spacing.s1,
  ...elevation.card,
}

const $photoBtnSolid: ViewStyle = {
  backgroundColor: forest50,
  borderWidth: 1.5,
  borderColor: forest500,
}

const $photoBtnSet: ViewStyle = {
  backgroundColor: forest100,
  borderColor: forest600,
}

const $photoBtnDashed: ViewStyle = {
  backgroundColor: card,
  borderWidth: 1.5,
  borderColor: hairline,
  borderStyle: "dashed",
}

const $photoBtnLabel: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 13,
  color: ink,
  marginTop: spacing.s1,
}

const $photoBtnLabelSet: TextStyle = { color: forest600 }

const $photoBtnSub: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 11,
  color: ink3,
}

const $textarea: TextStyle & ViewStyle = {
  backgroundColor: card,
  borderRadius: radii.xl,
  borderWidth: 1,
  borderColor: cardBorder,
  padding: spacing.s4,
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink,
  lineHeight: 21,
  minHeight: 120,
  marginBottom: spacing.s3,
  ...elevation.card,
}

const $actionRow: ViewStyle = {
  flexDirection: "row",
  gap: spacing.s3,
}

const $voiceBtn: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
  flex: 1,
  height: 48,
  borderRadius: radii.pill,
  borderWidth: 1,
  borderColor: hairline,
  backgroundColor: card,
  justifyContent: "center",
  ...elevation.card,
}

const $voiceBtnLabel: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: ink2,
}

const $saveBtn: ViewStyle = {
  flex: 1,
  height: 48,
  borderRadius: radii.pill,
  backgroundColor: forest500,
  alignItems: "center",
  justifyContent: "center",
}

const $saveBtnDisabled: ViewStyle = { backgroundColor: hairline }

const $saveBtnLabel: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 14,
  color: "#FFFFFF",
}

// ---------------------------------------------------------------------------
// Styles — Timeline
// ---------------------------------------------------------------------------

const $screenLabel: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 11,
  color: forest500,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  marginBottom: spacing.s1,
}

const $screenTitle: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 26,
  color: ink,
  lineHeight: 32,
  marginBottom: spacing.s6,
}

const $emptyState: ViewStyle = {
  paddingVertical: spacing.s10,
  alignItems: "center",
}

const $emptyStateText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink3,
  textAlign: "center",
  lineHeight: 22,
}

const $fab: ViewStyle = {
  position: "absolute",
  right: spacing.s5,
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
  backgroundColor: forest500,
  borderRadius: radii.pill,
  paddingHorizontal: spacing.s5,
  paddingVertical: 14,
  ...elevation.fab,
}

const $fabLabel: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 15,
  color: "#FFFFFF",
}

const $timelineItem: ViewStyle = {
  marginBottom: spacing.s2,
}

const $dayHeaderRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
  marginBottom: spacing.s3,
}

const $dayDot: ViewStyle = {
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: forest100,
}

const $dayDotToday: ViewStyle = {
  backgroundColor: forest500,
  width: 12,
  height: 12,
  borderRadius: 6,
}

const $dayHeaderLine: ViewStyle = {
  flex: 1,
  height: 1,
  backgroundColor: hairline,
}

const $dayLabel: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 11,
  color: ink3,
  letterSpacing: 0.8,
  textTransform: "uppercase",
}

const $dayLabelToday: TextStyle = { color: forest500 }

const $chipsRow: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.s2,
  marginBottom: spacing.s3,
}

const $chip: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 3,
  backgroundColor: forest50,
  borderRadius: radii.pill,
  paddingHorizontal: spacing.s3,
  paddingVertical: 5,
}

const $chipIcon: TextStyle = { fontSize: 12 }

const $chipText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: forest600,
}

const $emptyDayCard: ViewStyle = {
  borderRadius: radii.lg,
  borderWidth: 1,
  borderColor: hairline,
  borderStyle: "dashed",
  padding: spacing.s4,
  marginBottom: spacing.s4,
  alignItems: "center",
}

const $emptyDayText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink4,
}

// ── EntryCard ──

const $entryCard: ViewStyle = {
  backgroundColor: card,
  borderRadius: radii.xl,
  borderWidth: 1,
  borderColor: cardBorder,
  marginBottom: spacing.s4,
  overflow: "hidden",
  ...elevation.card,
}

const $entryActivityRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
  paddingHorizontal: spacing.s4,
  paddingTop: spacing.s4,
  paddingBottom: spacing.s2,
}

const $entryActivityIcon: TextStyle = { fontSize: 16 }

const $entryActivityName: TextStyle = {
  flex: 1,
  fontFamily: typography.primary.semiBold,
  fontSize: 13,
  color: forest600,
}

const $statusPill: ViewStyle = {
  backgroundColor: statusGoodBg,
  borderRadius: radii.pill,
  paddingHorizontal: spacing.s2,
  paddingVertical: 2,
}

const $statusPillText: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 11,
  color: forest600,
}

const $entrySectionHeader: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 10,
  color: ink4,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  paddingHorizontal: spacing.s4,
  paddingTop: spacing.s4,
  marginBottom: spacing.s2,
}

const $entryNotes: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink2,
  lineHeight: 21,
  fontStyle: "italic",
  paddingHorizontal: spacing.s4,
  paddingBottom: spacing.s4,
}

const $entryDivider: ViewStyle = {
  height: 1,
  backgroundColor: hairline,
}

const $entryMetaRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: spacing.s4,
  paddingVertical: spacing.s3,
  borderBottomWidth: 1,
  borderBottomColor: hairline,
}

const $entryMetaLeft: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
}

const $entryMetaLabel: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink3,
}

const $entryMetaAction: TextStyle = {
  fontFamily: typography.primary.medium,
  fontSize: 13,
  color: forest500,
}

const $aiSummaryBox: ViewStyle = {
  backgroundColor: paper2,
  paddingHorizontal: spacing.s4,
  paddingVertical: spacing.s3,
}

const $aiSummaryHeader: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.s2,
  marginBottom: spacing.s2,
}

const $aiSummaryEmoji: TextStyle = { fontSize: 14 }

const $aiSummaryLabel: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 10,
  color: forest500,
  letterSpacing: 0.8,
  textTransform: "uppercase",
}

const $aiSummaryText: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink2,
  lineHeight: 19,
}

const $aiSummaryEmpty: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 13,
  color: ink4,
  fontStyle: "italic",
}

const $connectorLine: ViewStyle = {
  width: 2,
  height: spacing.s3,
  backgroundColor: forest100,
  marginLeft: 4,
  marginBottom: spacing.s2,
}
