import type { ReactNode } from "react"
import { Text, TextStyle, View, ViewStyle } from "react-native"

import { ink, ink2, spacing } from "@/theme/tujiweze-tokens"
import { typography } from "@/theme/typography"

type AiMarkdownProps = {
  children: string
  /** Base text style for body paragraphs. */
  style?: TextStyle
}

type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "bullet"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "spacer" }

/**
 * Lightweight markdown renderer for AI replies (bold, italics, headings, bullets).
 * Avoids a heavy markdown dependency — covers the subset our backend emits.
 */
export function AiMarkdown({ children, style }: AiMarkdownProps) {
  const blocks = parseBlocks(children.trim())

  return (
    <View style={$root}>
      {blocks.map((block, index) => {
        if (block.type === "spacer") {
          return <View key={`sp-${index}`} style={$spacer} />
        }
        if (block.type === "heading") {
          return (
            <Text
              key={`h-${index}`}
              style={[
                $heading,
                block.level === 1 ? $h1 : block.level === 2 ? $h2 : $h3,
                style,
              ]}
            >
              {renderInline(block.text)}
            </Text>
          )
        }
        if (block.type === "bullet") {
          return (
            <View key={`b-${index}`} style={$bulletRow}>
              <Text style={[$bulletMark, style]}>•</Text>
              <Text style={[$body, $bulletText, style]}>{renderInline(block.text)}</Text>
            </View>
          )
        }
        return (
          <Text key={`p-${index}`} style={[$body, style]}>
            {renderInline(block.text)}
          </Text>
        )
      })}
    </View>
  )
}

export function parseBlocks(source: string): Block[] {
  if (!source) return []

  const lines = source.replace(/\r\n/g, "\n").split("\n")
  const blocks: Block[] = []
  let paragraph: string[] = []

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() })
    paragraph = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      if (blocks.length > 0 && blocks[blocks.length - 1]?.type !== "spacer") {
        blocks.push({ type: "spacer" })
      }
      continue
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed)
    if (heading) {
      flushParagraph()
      blocks.push({
        type: "heading",
        level: heading[1]!.length as 1 | 2 | 3,
        text: heading[2]!.trim(),
      })
      continue
    }

    const bullet = /^[-*•]\s+(.+)$/.exec(trimmed)
    if (bullet) {
      flushParagraph()
      blocks.push({ type: "bullet", text: bullet[1]!.trim() })
      continue
    }

    // Treat "**Label**: rest" lines as soft subheadings when they start a line.
    const boldLead = /^\*\*([^*]+)\*\*\s*:?\s*(.*)$/.exec(trimmed)
    if (boldLead && boldLead[2] !== undefined) {
      flushParagraph()
      const rest = boldLead[2].trim()
      if (rest) {
        blocks.push({ type: "bullet", text: `**${boldLead[1]}**: ${rest}` })
      } else {
        blocks.push({ type: "heading", level: 3, text: boldLead[1]! })
      }
      continue
    }

    paragraph.push(trimmed)
  }

  flushParagraph()
  return blocks.filter((b, i, arr) => !(b.type === "spacer" && (i === 0 || i === arr.length - 1)))
}

function renderInline(text: string): ReactNode[] {
  const nodes: React.ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index))
    }
    const token = match[0]!
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <Text key={`b-${key++}`} style={$bold}>
          {token.slice(2, -2)}
        </Text>,
      )
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(
        <Text key={`i-${key++}`} style={$italic}>
          {token.slice(1, -1)}
        </Text>,
      )
    } else {
      nodes.push(token)
    }
    last = match.index + token.length
  }

  if (last < text.length) {
    nodes.push(text.slice(last))
  }

  return nodes.length > 0 ? nodes : [text]
}

export default AiMarkdown

const $root: ViewStyle = {
  gap: spacing.s2,
}

const $spacer: ViewStyle = {
  height: spacing.s1,
}

const $body: TextStyle = {
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: ink2,
  lineHeight: 21,
}

const $heading: TextStyle = {
  fontFamily: typography.primary.bold,
  color: ink,
  marginTop: spacing.s1,
}

const $h1: TextStyle = { fontSize: 17, lineHeight: 24 }
const $h2: TextStyle = { fontSize: 16, lineHeight: 22 }
const $h3: TextStyle = { fontSize: 14, lineHeight: 20 }

const $bulletRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.s2,
  paddingRight: spacing.s1,
}

const $bulletMark: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 14,
  color: ink2,
  lineHeight: 21,
  width: 12,
}

const $bulletText: TextStyle = {
  flex: 1,
}

const $bold: TextStyle = {
  fontFamily: typography.primary.semiBold,
  color: ink,
}

const $italic: TextStyle = {
  fontFamily: typography.primary.normal,
  fontStyle: "italic",
}
