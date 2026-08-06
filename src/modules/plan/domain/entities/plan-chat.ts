export interface ChatReply {
  markdown: string
  plain: string
}

export interface SuggestionCard {
  id: string
  action: "add" | "update" | "remove"
  title: string
  reason: string
  ctaLabel: string
  planDayId?: string
}

export interface PlanChatResult {
  messageId: string
  reply: ChatReply
  confidence: string
  suggestionCards: SuggestionCard[]
}
