# Tapp — Single-Button Family Budgeting App

## Product Requirements Document

**Version:** 1.0
**Status:** Full Scope
**Date:** April 2026
**Classification:** Confidential

---

## Table of Contents

1. [Product Vision & Strategic Context](#1-product-vision--strategic-context)
2. [Economic Model — Monetization & Distribution](#2-economic-model--monetization--distribution)
3. [Target Users & Personas](#3-target-users--personas)
4. [Core Feature Set](#4-core-feature-set)
5. [Technical Architecture](#5-technical-architecture)
6. [Data Model](#6-data-model)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [AI Layer & SMS Integration](#9-ai-layer--sms-integration)
10. [Security & Compliance](#10-security--compliance)
11. [Development Roadmap](#11-development-roadmap)
12. [Risks & Mitigations](#12-risks--mitigations)
13. [Success Metrics](#13-success-metrics)

---

## 1. Product Vision & Strategic Context

### Core Problem

Families fail to track expenses consistently. Traditional budgeting apps demand high-friction multi-step input, break habit loops, and don't align with the moment money is spent. The result is sporadic logging, blind spots, and no shared financial visibility.

### Solution

Tapp solves this with a single persistent home-screen button. One tap at the point of spend — no forms, no navigation. Category is inferred from time, routine, and history, and corrected after the fact in a lightweight daily review. The system meets users in real life rather than demanding they adapt to it.

### Primary Goals

- Enable near-zero-friction expense logging
- Capture accurate daily spending behavior with minimal user input
- Provide shared financial visibility for families
- Deliver actionable daily and monthly insights

### Secondary Goals

- Improve awareness of spending habits
- Support budget adherence per category
- Encourage consistent usage through simplicity

### Non-Goals (V1)

- Advanced financial planning tools
- Investment tracking
- Bank integrations or automated transaction syncing
- AI-heavy advisory systems
- Social or public sharing features

### Market Positioning

Designed for families in markets where manual tracking is preferred over bank integrations — East Africa, Southeast Asia, and similar regions with high mobile penetration but low open-banking adoption. Operates under intermittent connectivity and is SMS-augmentable for transaction confirmation via services like M-Pesa.

---

## 2. Economic Model — Monetization & Distribution

This section addresses a critical gap in the initial product definition. Tapp lives or dies on habit formation and family adoption — both of which are deeply affected by pricing boundaries, growth loops, and how the product spreads. Defining this early prevents costly architectural and positioning pivots later.

### 2.1 Pricing Strategy

The recommended model is a **freemium subscription** with a permanent free tier generous enough to drive habit formation, and a paid tier that unlocks the features that matter most once a family is already hooked.

**Free tier (permanent):**

- 1 user, up to 3 categories
- Unlimited tap logging
- 30-day expense history
- Basic daily review and correction
- Single-device only (no sync)

**Tapp Family — paid tier:**

- Multi-user family group (up to 6 members)
- Unlimited categories and routines
- Full expense history
- Shared family view with per-member breakdown
- Budget tracking and heat indicators
- Multi-device sync
- Weekly and monthly reports
- AI insights and natural language queries (V2)
- SMS transaction matching (V2, Android)

**Pricing model:** Monthly and annual subscription per family group (not per user). One subscription covers the whole family — this is intentional. It aligns pricing with the product's core value proposition (shared visibility) and removes friction for adding members.

**Suggested price points (to be validated with market research):**

- Monthly: $3.99–$5.99 / family / month
- Annual: $29.99–$39.99 / family / year (~40% discount vs. monthly)
- These are positioned for target markets with lower average revenue per user (ARPU) than Western markets. Localized pricing per region is essential.

**No per-seat pricing in V1.** Per-user pricing creates friction for adding family members — the opposite of the growth dynamic this product needs.

### 2.2 Free vs. Paid Boundaries

The free tier must be genuinely useful — not crippled. The goal is to let a single user build a logging habit over weeks, then hit a natural ceiling that makes upgrading feel like an obvious next step rather than a paywall.

The upgrade trigger is designed to be the moment a user wants to share: they've built the habit solo and now want their partner or family to see it. That moment is the conversion event.

| Capability         | Free             | Paid                     |
| ------------------ | ---------------- | ------------------------ |
| Tap logging        | Unlimited        | Unlimited                |
| Categories         | 3                | Unlimited                |
| History            | 30 days          | Full                     |
| Family members     | 1                | Up to 6                  |
| Multi-device sync  | No               | Yes                      |
| Shared family view | No               | Yes                      |
| Budget tracking    | Basic (1 budget) | Per-category, per-period |
| Reports            | Daily only       | Daily, weekly, monthly   |
| AI insights        | No               | Yes (V2)                 |
| SMS matching       | No               | Yes (V2, Android)        |

### 2.3 Growth Loops

Tapp has two structural growth loops baked into the product. These must be designed explicitly — they don't emerge on their own.

**Loop 1 — The family invite loop (primary)**
User builds habit solo (free) → wants shared visibility with partner or family → invites them → family group created → upgrade to paid tier → each new member invited reinforces the habit and the subscription value.

Design requirements:

- Invite flow must be dead simple: a link, a QR code, or a short join code
- New member onboarding must get them to their first tap within 60 seconds
- Family coordinator sees a prompt to invite after 7 days of consistent solo logging

**Loop 2 — The social proof loop (secondary)**
Family member sees shared dashboard → talks about it with friends or extended family → word of mouth referral. This loop is low-friction because it doesn't require the product to do anything — it happens in conversation. The shared family view and insight reports need to be genuinely interesting to make this work.

Design requirements:

- Insight summaries must be share-worthy (human-readable, not raw numbers)
- Monthly summary card must be exportable as an image or PDF for easy sharing
- No friction on sharing — no login wall for referred users landing on an invite link

### 2.4 Acquisition Channels

Given the target market (East Africa, Southeast Asia, and similar regions), the following acquisition channels are prioritized in order of expected return:

**1. Organic / word of mouth**
The primary channel at launch. Family and social networks are tight in target markets. A product genuinely useful to one household member spreads to their network naturally. No paid acquisition budget required in Phase 1.

**2. App store optimization (ASO)**
Search intent in target markets: "family budget app", "expense tracker Kenya", "M-Pesa tracker". ASO should be localized per market from day one, not retrofitted.

**3. Community and creator partnerships**
Personal finance creators, savings group (chama) communities, and family-focused WhatsApp groups in target markets. Seeding early access through trusted community voices is higher leverage than broad paid ads at this stage.

**4. Referral incentive (Phase 3+)**
Once the product is stable and retention is validated: a referral program that grants both referrer and referee one free month of Tapp Family. Referral incentives should be introduced only after organic growth is understood — premature referral programs attract non-ideal users.

**5. Paid acquisition (Phase 4+)**
Facebook, Instagram, and TikTok ads targeted by country and interest (budgeting, personal finance, family). Only activated once LTV:CAC ratio is understood from organic cohorts.

### 2.5 Why This Matters for Architecture

The economic model has direct implications for the technical architecture already defined:

- **Multi-tenancy** supports the family group subscription unit — the tenant boundary (family group) is also the billing boundary
- **Free tier limits** (3 categories, 30-day history, no sync) must be enforced server-side, not just in the UI — they are part of the product contract
- **Invite and join flow** (FR-U02, FR-U03) is a growth-critical path — it must be friction-free and work offline-first
- **Export / share** for insight reports (monthly summary card) requires a document generation capability not currently in scope — add to Phase 4

### 2.6 Hybrid Pricing Model: "Tapp Local" + "Tapp Plus"

To address price-sensitivity and trust barriers in target markets, we recommend a hybrid approach:

- **Tapp Local (Pay-Once Own-Forever)**
  - One-time localized payment (example: 500–1,000 KES / $5–$10 USD).
  - Features: P2P sync on the same network, local-only Shadow/Draft expenses, core single-button logging, basic local reports, family license recommended (covers the household, not per-device).
  - No cloud dependency for core features; master SQLite file per-family acts as local history.

- **Tapp Plus (Subscription)**
  - Monthly/annual micro-subscription that unlocks cloud services: real-time cloud sync, AI budgeting, SMS transaction parsing, remote Shadow Events, and cloud backup.
  - Provides the recurring revenue to offset backend and LLM costs.

Hybrid strategy notes:

- Offer a short trial (e.g., 3 months) of Tapp Plus features when purchasing Tapp Local to encourage conversion.
- P2P sync uses mDNS / ZeroConf for local discovery and recommends using a tested library (Ditto, ZeroTier) and CRDTs for merge safety.
- Mitigate payment friction by supporting localized direct checkout (M-Pesa / local payment providers) and activating via a license key to avoid app-store fees where appropriate.

---

## 3. Target Users & Personas

### Primary: Family Coordinator

Manages shared household expenses. Wants visibility across all members. Logs frequently, reviews daily. Often the account owner and budget setter. Comfort with mobile apps, but limited patience for complex UX.

### Primary: Contributing Member

Spouse or partner who participates in shared spending. Needs frictionless logging. Doesn't want to manage the budget — just contribute accurately. May have lower digital engagement than the coordinator.

### Secondary: Budget Reviewer

Reviews aggregated reports weekly or monthly. May not log expenses themselves. Focused on trends, category adherence, and family totals. Could be a financially-minded family member who doesn't carry out daily spending.

---

## 4. Core Feature Set

### 3.1 Onboarding & Setup

First-run experience must be completable in under 3 minutes. Account creation can be deferred until sync is needed — local-only mode should work from minute one.

- Category creation with custom name and color assignment
- Time-based routine configuration (time windows mapped to categories)
- Optional default amount per category
- Budget limits per category per period
- Family group creation and join flow
- Home-screen widget placement guide (OS-specific)

### 3.2 Single-Button Logging

**Core interaction contract:** button tap → timestamped expense event logged locally → category predicted → button color updates. Total perceived latency must be under 100ms. No navigation, no modal, no confirmation required at tap time.

#### Point-of-Tap Annotation (Hold to Note)

To reduce uncertainty about small or ambiguous spends, the interaction contract supports a short long-press gesture: a 100ms tap remains the default "log and go" action, while a long-press (with haptic feedback) opens a 3-second "Quick Note" overlay. The user may speak a single word or type a 2–3 character snippet (e.g., "Pizza" or "taxi") which is attached to the event UUID and surfaced prominently in the Daily Review to aid recall.

### 3.3 Category Prediction Engine

**V1 — Rule-based:**
Time-of-day windows mapped to user-defined routines. Fully deterministic. Example: 7–9am → Breakfast, 12–2pm → Lunch, 5–8pm → Dinner/Groceries. Defined per user during onboarding and editable at any time.

**V2+ — Adaptive:**
Correction patterns fed back into prediction weights. SMS transaction data used as ground truth for validation. LLM-assisted context parsing for merchant name classification.

Prediction accuracy target: correction rate below 30%. A correction rate above 40% is a trust failure signal requiring model review.

### 3.4 Daily Review & Correction

End-of-day summary surfaces all logged events. The UI must be scannable and fast — not form-heavy. Users can:

- Reassign the category of any event
- Enter or edit the exact amount
- Add a free-text note
- Delete an event

Confirmed entries persist locally and sync to server. Corrections dispatch background jobs (server-side when cloud-enabled) or schedule local projection recalculation; these jobs update budget projections.

### Shadow / Draft Events & Catch-Up (Missed Taps)

To handle missed taps and "batch taps" we introduce two complementary mechanisms: Catch-Up assignment for burst taps and Shadow (Draft) Events for probable-but-unconfirmed routine spends.

- Catch-Up Intelligent Burst: If the system detects more than 2 taps within a 2-minute window, it should pivot from the Current Time Prediction to a Vacant Routine Prediction. The system looks back to earlier routines from the same day that have no corresponding tap and assigns the burst taps chronologically to those vacant routine slots, then to the current routine. The user receives a temporary toast: "Detected 3 catch-up taps. We've assigned them to missed routines from earlier today. [Review Now]".

- Shadow / Draft Events: For high-confidence routines (e.g., daily commute), if no tap is recorded within a configured grace period (default: 2 hours after routine end), the app generates a Shadow Event. Shadow Events:
  - Appear in the Daily Review and Family View with a ghost/striped UI treatment to indicate they are unconfirmed.
  - Do not deduct from "Actual Spent" but are included in a "Projected Spend" line to avoid overestimating available funds.
  - Are resolvable in Daily Review: users can "Swipe to Confirm" (convert to real expense) or "Dismiss" (remove the shadow).

These mechanisms reduce the "mystery tap" problem while preserving a low-friction logging contract.

**Summary of the flow**

- User forgets to tap for Lunch; system creates a Shadow Event at ~2:00 PM based on the Lunch routine.
- Family Coordinator sees a "Projected" spend on the dashboard indicating likely money spent.
- User batch-taps twice at 6:00 PM; the system detects a catch-up burst, assigns one tap to the missed Coffee routine and one to the current Snack routine, and surfaces a review toast.
- During Daily Review the user confirms or dismisses Shadow Events; confirmed shadows become real expenses and update family projections.

### 3.5 Budget Tracking

Budgets are defined per category per period (weekly or monthly). The system tracks remaining balance and consumption rate in real time using precomputed projections from background job workers (server-side) or local projection tasks (local-only mode).

Visual heat indicators surface budget pressure: green → amber → red. Configurable alert thresholds (e.g., 80% consumed) trigger push notifications. Rollover of unspent budget to the next period is optional per category.

### 3.6 Shared Family View

Aggregated view shows total spend across all family members, broken down by category. Individual member contributions are visible. A per-user privacy toggle allows certain categories to be hidden from shared view. Real-time sync uses WebSockets (Pusher / Laravel Reverb) to broadcast projection updates; the Family View reads from precomputed summary tables to stay performant. Eventual consistency is acceptable.

### 3.7 Insights & Reporting

- Daily spend summary
- Category breakdown (daily, weekly, monthly)
- Spending by time of day
- Category trend lines and period comparisons
- Budget over/under performance
- AI-generated narrative insights — async, delivered via push notification (V2)
- Natural language spend queries (V2)

---

## 5. Technical Architecture

### 4.1 Stack Overview

**Mobile Client:**
React Native · Ignite Red · Expo / EAS · Zustand (state) · SQLite (local DB) · React Native Background Tasks

**Backend:**
Laravel · PostgreSQL · Redis (Laravel Queues / Horizon) · Laravel Sanctum (JWT) · WebSockets (Pusher / Laravel Reverb) · Firebase Cloud Messaging (FCM)

**AI:**
OpenAI / Anthropic API (via internal AI microservice — never called directly from client)

### 4.2 Architecture Principles

**Offline-first by default**
Local SQLite database is the source of truth. All writes are local first. A background sync worker pushes the event queue to the API when connectivity is available. Eventual consistency is acceptable across devices. Idempotent operations ensure safe replay on sync.

**Event-sourced data model**
Every user action produces an immutable event with a UUID and client timestamp. Events are append-only and persisted to an `expense_events` append-only table. State is derivable from event replay. Instead of a distributed streaming platform in V1, background workers (Laravel Jobs) consume those persisted events to produce projections and insights.

**Multi-tenant isolation**
Family group = tenant. Single database with `tenant_id` (i.e., `family_group_id`) on all rows. Enforced via Laravel Global Scopes and Tenant Context Middleware. Row-level isolation. Roles: Owner, Member, Viewer.

**Minimal backend coupling**
Laravel functions as the command and API layer — it persists events to the `expense_events` table and dispatches Laravel Jobs to perform downstream processing and projection updates. The client never depends on the backend being available for core functionality (local-first mode).

### 4.3 Background Jobs & Projection Design

The V1 processing model uses a persisted append-only `expense_events` table and Laravel Jobs (Redis-backed queues) for downstream work. Jobs are monitored via Laravel Horizon and are horizontally scalable.

| Job / Projection         | Producer             | Consumer / Reader                                                                  |
| ------------------------ | -------------------- | ---------------------------------------------------------------------------------- |
| `expense_events` (table) | Mobile → Laravel API | `UpdateFamilyBudget` job, analytics jobs, AI job enqueuer                          |
| `UpdateFamilyBudget`     | Job dispatcher       | Updates `budget_summaries` projection table, broadcasts via WebSocket / FCM        |
| `AiInsightRequest` job   | API / Job dispatcher | AI microservice job processors; results persisted and delivered via push/WebSocket |
| `SyncFlush` (device)     | Mobile Sync Manager  | API ack / conflict resolution endpoint                                             |

Job workers are horizontally scalable; partitioning strategy is implemented at the job level if needed, but V1 avoids distributed streaming complexity.

### 4.4 Offline Sync & Conflict Resolution

Each expense event carries a UUID, client-generated timestamp, and device ID. The local sync queue persists events until the server acknowledges them. Deduplication is handled server-side by UUID.

Conflict resolution strategy:

- **Tap events** — append-only, no conflicts possible
- **Amount / category corrections** — last-write-wins based on server receipt timestamp
- **Deletions** — deletion always wins over concurrent edits to the same event

All merge rules are deterministic and documented per event type in the engineering specification.

### 4.5 Read / Write Model Separation

**Write model (events):** Append-only event log persisted to the `expense_events` table. Never mutated; events are the canonical record. Jobs (Laravel Jobs) or local projection tasks consume persisted events to derive state.

**Read models (projections):** Precomputed by background job workers (Laravel Jobs) or by local projection tasks — budget summaries, category totals, user dashboards, reporting aggregates. Stored in PostgreSQL and cached in Redis for hot reads.

### 4.6 Client Architecture Detail

- **State management:** Zustand stores for UI state; SQLite as the persistent local store
- **Background sync:** Headless JS or Expo Background Tasks; exponential backoff on failure; max queue age of 7 days before user notification
- **Widget:** Android — native widget via Expo Modules API or react-native-widget-extension; iOS — WidgetKit deep-link, or Shortcuts / Action Button
- **Networking:** Axios wrapper with retry logic, request queuing, and connectivity detection

---

### 4.7 Simplified Architecture (Recommended for MVP)

To reduce operational overhead and accelerate velocity in V1, the following simplified architecture is recommended in place of introducing a distributed streaming platform early:

- **Message Bus / Background Processing:** Laravel Queues with Redis + Laravel Horizon for job processing and monitoring instead of Kafka. Background jobs handle budget recalculation, insight generation, and projection updates.

- **Event Store:** PostgreSQL `expense_events` table treated as append-only. When the API receives an event, it persists to the DB and dispatches a Laravel Job (e.g., `UpdateFamilyBudget`) immediately.

- **Projection Service:** Jobs or DB listeners update a `budget_summaries` projection table. The family dashboard reads from these precomputed summaries for fast responses.

- **Mobile Sync Manager (Scheduler on-device):** Client maintains a local SQLite `SyncQueue` table. On each tap or connectivity change the Sync Manager attempts to push pending events. If immediate sync fails, the mobile scheduler retries with exponential backoff (e.g., 5m → 15m → 1h). Use OS-level background fetch (WorkManager / BackgroundTasks / Expo Background Fetch) to flush the queue periodically.

- **Realtime Family Sync:** Use WebSockets (Pusher / Laravel Reverb) to broadcast projection updates to family channels. This provides near-instant updates without Kafka replication.

This approach reduces infra costs and complexity while preserving the core event-driven design and read-model projections needed for a responsive Family View.

## 6. Data Model

| Entity                     | Key Fields                                                                                                                 | Notes                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `User`                     | id, family_group_id, role, device_tokens, created_at                                                                       | Roles: owner, member, viewer                      |
| `FamilyGroup`              | id, name, owner_user_id, settings_json                                                                                     | Tenant boundary                                   |
| `Category`                 | id, family_group_id, name, color_hex, icon, is_private                                                                     | Per-tenant, colorized                             |
| `Routine`                  | id, category_id, time_start, time_end, days_of_week                                                                        | Drives prediction engine                          |
| `Budget`                   | id, category_id, limit_amount, currency, period, rollover                                                                  | Per-category per-period                           |
| `ExpenseEvent`             | uuid, user_id, family_group_id, tapped_at, predicted_category_id, actual_category_id, amount, note, sync_status, device_id | Core event entity; append-only                    |
| `SyncQueue`                | id, event_uuid, payload_json, attempts, last_attempt_at, status                                                            | Client-side offline queue                         |
| `Projection_BudgetSummary` | family_group_id, category_id, period, spent, remaining, updated_at                                                         | Computed by background job workers (Laravel Jobs) |
| `AiInsight`                | id, family_group_id, type, content_json, delivered_at                                                                      | Async delivery via FCM                            |

---

## 7. Functional Requirements

### User & Family Management

| ID     | Requirement                                                                                              |
| ------ | -------------------------------------------------------------------------------------------------------- |
| FR-U01 | User can register with email or phone number and receive OTP verification                                |
| FR-U02 | User can create a family group and invite members via shareable link or code                             |
| FR-U03 | User can join an existing family group using an invite link or code                                      |
| FR-U04 | Owner can assign and revoke member roles (owner, member, viewer)                                         |
| FR-U05 | User can mark specific categories as private (visible only to them within the family group)              |
| FR-U06 | Projection Toggle: Users can toggle whether Shadow/Draft expenses are visible in the shared Family View. |

### Category & Budget Configuration

| ID     | Requirement                                                                              |
| ------ | ---------------------------------------------------------------------------------------- |
| FR-C01 | User can create, edit, and delete expense categories with a name and color               |
| FR-C02 | User can assign time-based routines to categories (start time, end time, days of week)   |
| FR-C03 | User can set a default expected amount per category                                      |
| FR-C04 | User can define a budget limit per category per period (weekly or monthly)               |
| FR-C05 | User can configure alert thresholds for budget utilization (e.g., alert at 80% consumed) |
| FR-C06 | User can enable or disable budget rollover per category                                  |

### Expense Logging

| ID     | Requirement                                                                                                                                  |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-L01 | System logs a timestamped expense event on button tap with no user input required                                                            |
| FR-L02 | System predicts expense category based on current time and user-defined routines                                                             |
| FR-L03 | Button color reflects the currently predicted category at time of tap                                                                        |
| FR-L04 | Tap-to-log latency is under 100ms perceived on-device                                                                                        |
| FR-L05 | All expense events are logged locally first, regardless of connectivity                                                                      |
| FR-L06 | System maintains a local sync queue and pushes events to the server when connected                                                           |
| FR-L07 | Sync queue persists across app restarts and device reboots                                                                                   |
| FR-L08 | Batch Detection: System identifies multiple taps within 120 seconds as a "catch-up burst" and prompts for quick sequential assignment.       |
| FR-L09 | Shadow Events: System generates unconfirmed "Draft" expenses for missed high-confidence routines to maintain projected budget accuracy.      |
| FR-L10 | Intelligent Sync Management: System maintains a local SQLite-based sync queue and background scheduler with exponential backoff for retries. |

### Daily Review & Correction

| ID     | Requirement                                                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| FR-R01 | User receives an end-of-day summary push notification                                                                          |
| FR-R02 | User can view all logged events for the day with predicted categories and timestamps                                           |
| FR-R03 | User can reassign the category of any logged event                                                                             |
| FR-R04 | User can enter or edit the amount for any logged event                                                                         |
| FR-R05 | User can add a free-text note to any logged event                                                                              |
| FR-R06 | User can delete any logged event                                                                                               |
| FR-R07 | Confirmed corrections sync to server and update budget projections via background jobs / projection updates                    |
| FR-R08 | Shadow Resolution: Daily Review must prioritize confirmation or dismissal of Shadow Events before finalizing the day's report. |

### Budget Tracking

| ID     | Requirement                                                                         |
| ------ | ----------------------------------------------------------------------------------- |
| FR-B01 | System tracks remaining budget balance per category in real time                    |
| FR-B02 | System displays visual heat indicators (green / amber / red) for budget utilization |
| FR-B03 | System sends a push notification when a budget threshold is crossed                 |
| FR-B04 | System resets category budgets at the start of each period                          |

### Shared Family View

| ID     | Requirement                                                                    |
| ------ | ------------------------------------------------------------------------------ |
| FR-F01 | System displays aggregated family spend with per-member contribution breakdown |
| FR-F02 | Family view updates in near real time as members log and confirm expenses      |
| FR-F03 | Private categories are excluded from the family aggregate view                 |
| FR-F04 | Owner can view per-member spending reports                                     |

### Insights & Reporting

| ID     | Requirement                                                                        |
| ------ | ---------------------------------------------------------------------------------- |
| FR-I01 | System displays daily, weekly, and monthly spend totals per category               |
| FR-I02 | System displays aggregated family spend with per-member breakdown                  |
| FR-I03 | System displays budget utilization with visual heat indicators                     |
| FR-I04 | System surfaces spending-by-time-of-day and category trend data                    |
| FR-I05 | AI-generated insight summaries delivered asynchronously via push notification (V2) |
| FR-I06 | User can query spending data in natural language via AI chat interface (V2)        |

---

## 8. Non-Functional Requirements

### Performance

| ID      | Requirement                                                                              |
| ------- | ---------------------------------------------------------------------------------------- |
| NFR-P01 | Button tap to event logged: under 100ms perceived latency on-device (P95)                |
| NFR-P02 | App cold start to interactive: under 2 seconds on mid-range Android hardware             |
| NFR-P03 | Background sync must not noticeably impact battery life (under 2% daily overhead target) |
| NFR-P04 | Daily review screen must render up to 30 events without perceptible lag                  |

### Resilience

| ID      | Requirement                                                                       |
| ------- | --------------------------------------------------------------------------------- |
| NFR-R01 | App must be fully functional in offline mode for an indefinite period             |
| NFR-R02 | Sync queue must survive app restarts and device reboots                           |
| NFR-R03 | Idempotent sync: replaying the same event must not produce duplicate records      |
| NFR-R04 | Sync worker uses exponential backoff; user notified if queue exceeds 7 days stale |

### Security

| ID      | Requirement                                                                               |
| ------- | ----------------------------------------------------------------------------------------- |
| NFR-S01 | All data in transit encrypted via HTTPS / TLS 1.3                                         |
| NFR-S02 | All data at rest encrypted — SQLite encryption on device, encrypted volumes on server     |
| NFR-S03 | Tenant data fully isolated; no cross-tenant data leakage possible via API                 |
| NFR-S04 | Authentication via JWT with short-lived access tokens (15 min) and refresh token rotation |
| NFR-S05 | All API mutations require role authorization checks                                       |

### Scalability

| ID       | Requirement                                                                          |
| -------- | ------------------------------------------------------------------------------------ |
| NFR-SC01 | Backend API is stateless and horizontally scalable                                   |
| NFR-SC02 | Background job workers are independently scalable per job type                       |
| NFR-SC03 | Read queries served from Redis cache or PostgreSQL read replicas, not the primary DB |

### Accessibility

| ID      | Requirement                                                                       |
| ------- | --------------------------------------------------------------------------------- |
| NFR-A01 | Minimum WCAG 2.1 AA compliance for all mobile UI                                  |
| NFR-A02 | RTL language support architected from the start, even if not active in V1 content |

---

## 9. AI Layer & SMS Integration

### 8.1 AI Use Cases

**Setup assistant (V2)**
AI suggests budget allocations based on stated income and household size. Reduces setup friction for first-time users who don't know where to start.

**Smart categorization (V2)**
Improves prediction beyond rule-based matching using merchant name parsing, historical correction patterns, and contextual signals.

**Natural language queries (V2)**
Users can ask questions like "How much did we spend on food last month?" and receive plain-language responses. Family spend data is injected as structured context — the AI does not access raw data directly.

**Behavioral insights (V2)**
Async insight delivery: "You've spent 40% more on transport this week compared to your 4-week average." Generated by AI workers consuming precomputed analytics aggregates or job-driven analytics and delivered via FCM.

### 8.2 AI Architecture

AI APIs must never be called directly from the frontend. All calls flow through:

```
Mobile Client → Laravel API → AI Microservice → OpenAI / Anthropic API
```

The AI microservice owns:

- Prompt engineering and templating
- Context assembly (user history, categories, budgets, family aggregates)
- Output normalization and validation
- Hallucination guardrails (structured data injection, output schema enforcement)

Responses arrive asynchronously via persisted job results (stored in the DB) and are delivered via push notification or WebSocket broadcast. For synchronous NL query responses, a polling or server-sent event pattern is used in-app.

### 8.3 Prompt Context Design

AI prompts must include structured context, never open-ended data dumps:

- User's category list and budget limits
- Aggregated spend by category for the relevant period
- Family group total and per-member breakdown
- Historical correction patterns (for categorization)
- Explicit output format instructions and factual grounding constraints

### 8.4 SMS Transaction Matching (Android V2)

Payment SMS messages from services like M-Pesa and bank SMS alerts contain amount, merchant, and timestamp — ideal ground truth for validating and auto-filling tapped expense events.

**Platform scope:** Android only. iOS does not allow SMS read access.

**Processing model:** Fully local — SMS content is never uploaded to the server under any circumstances.

**Matching logic:**

1. User taps the button — a "pending" expense event is created locally
2. SMS arrives (BroadcastReceiver monitors configured sender IDs)
3. System parses SMS: extracts amount via regex, merchant name via pattern matching
4. Time window match is performed between SMS arrival and the most recent pending tap event (configurable window, default 5 minutes)
5. If confidence threshold is met, amount and merchant are auto-filled on the pending event
6. If below threshold, a suggestion is surfaced in the daily review for user confirmation

**Safeguards:**

- Explicit opt-in during onboarding with clear explanation of local-only processing
- User can disable at any time in settings
- No SMS content stored or transmitted
- All auto-fills are overridable
- Android permission rationale screen required before requesting READ_SMS

---

## 10. Security & Compliance

### Authentication & Authorization

- OTP-based registration (email or phone) — no password required for MVP
- JWT via Laravel Sanctum: 15-minute access tokens with rotating refresh tokens
- All API endpoints scoped to authenticated tenant context via middleware
- Laravel Global Scopes enforce `family_group_id` on all database queries
- Role checks on every mutation — unauthorized operations return 403, not 404

### Data Handling

- SQLite encryption on device using SQLCipher
- PostgreSQL encrypted at rest via provider-level disk encryption
- HTTPS / TLS 1.3 enforced for all API communication
- PII minimization — only store what is necessary for product functionality
- SMS content: local-only, never stored or synced

### Compliance Requirements

This application handles financial behavior data and optionally reads payment SMS messages, placing it in a sensitive data category in most jurisdictions.

- **Kenya Data Protection Act (2019):** Applies to any deployment targeting Kenyan users. A formal Data Protection Impact Assessment (DPIA) is required before launch, particularly for the SMS feature.
- **GDPR:** Applies if any EU residents use the product. Right to erasure and data portability must be supported.
- **Privacy policy:** Must explicitly describe SMS data handling (local-only, never uploaded), data retention policy, and family group data sharing model.
- **App store review:** SMS READ permissions require a clear policy justification for both Google Play and any sideload distribution. Prepare rationale documentation before submission.

Legal review is strongly recommended before the SMS feature ships to production.

---

## 11. Development Roadmap

### Phase Overview

**Phase 1 — Single-tenant MVP (local-first core)**
Onboarding flow · Category and routine setup · Home-screen button widget · Local SQLite event logging · Rule-based category prediction · Daily review and correction screen · Basic budget tracking · Single-user local-only mode

**Engineering Plan — Pay-Once Local / Peer-to-Peer (No-Backend) Mode**

Objective: deliver a fully functional "Tapp Local" experience that requires no cloud backend for core features, enabling a pay-once ownership model and eliminating server costs for those customers.

Key components:

- Local Append-Only Store: a master SQLite file per family that records `expense_events`, `categories`, `routines`, `budgets`, and `projections`.

- P2P Discovery & Transport: mDNS / ZeroConf for same-network discovery; fallback to Bluetooth/Wi-Fi Direct where available. Use a robust library (Ditto, ZeroTier) rather than custom networking.

- Data Merge Model: CRDTs for conflict-free merges of category lists, routines, and events. Event appends are naturally CRDT-friendly; per-event edits use deterministic merge rules (last-writer-wins with device priority or logical clocks) documented in the engineering spec.

- Host Election & Master File: simple deterministic host election (e.g., stable coordinator device ID or user-designated coordinator) designates one device as the "Local Primary" for conflict arbitration and hosting the master file. Other devices keep local replicas.

- Sync Protocol: lightweight sync protocol exchanging compact change-sets (event UUIDs + deltas), applying CRDT merges, and reconciling the master SQLite file. Ensure idempotency and compact transfer.

- License Activation: purchases processed via localized direct payment (M-Pesa / local provider) yield a license key; activation is performed offline by entering a license key which unlocks family license features. Optionally support QR-based activation from a web checkout.

- Local Backup & Export: allow users to export/import the master SQLite file to external storage (SD card, file share) and to create encrypted backups to a user-provided cloud service (Google Drive) to reduce support burden.

- Upgrade Bridge: provide a migration tool to move a local family to cloud mode (Tapp Plus) if they later choose subscription — this uploads the master SQLite events and activates server-side projections.

QA & Testing Considerations:

- Test cross-device sync across a matrix of common Android OEMs and iOS versions; prioritize Android robustness for initial P2P delivery.
- Fuzz test CRDT merges, offline edits, and host election edge cases.
- Performance test master file size growth and syncing times for families with long histories (up to 5 years of events).

Deliverables for V1 Local/P2P:

- `sync-protocol.md` spec and reference implementation in the mobile client
- CRDT design doc and test harness
- License activation UX + local activation flow
- Local backup/import/export flow

**Phase 2 — Backend + event model + sync**
Laravel API layer · PostgreSQL schema with event log · Auth (OTP + JWT) · Background sync worker · Offline queue with deduplication · Family group creation and joining · Multi-device sync with eventual consistency

**Phase 3 — Multi-tenancy + Queue-based projection service**
Tenant isolation middleware (Laravel Global Scopes) · Redis-backed Laravel Queues and Horizon for job processing · Budget calculation job workers · Analytics job pipeline · Projection service (`budget_summaries`, `projection_*` tables) · Shared family view with real-time aggregation via WebSockets

**Phase 4 — Insights, reporting, and notifications**
Weekly and monthly report views · Spending trend charts · Time-of-day heatmaps · Budget heat indicators · Push notification system (FCM) · Daily summary notifications · Budget alert notifications

**Phase 5 — AI layer + SMS integration**
AI microservice (OpenAI / Anthropic) · Budget setup assistant · AI-assisted categorization improvements · Natural language spend queries · SMS BroadcastReceiver (Android) · Transaction matching engine · Adaptive prediction learning from correction history

---

### Sprint Breakdown — Phase 1 (Detailed)

**Sprints 1–2: Foundation**

- React Native + Ignite Red scaffold and navigation setup
- SQLite schema: categories, routines, expense events, sync queue
- Zustand store architecture
- Category CRUD screens with color picker
- Routine configuration UI

**Sprints 3–4: Core logging**

- Home-screen widget implementation (Android first, iOS fallback)
- Tap handler with local SQLite write
- Rule-based prediction engine (time-of-day → category mapping)
- Basic local P2P sync prototype: mDNS discovery, compact change-set exchange, and host election test harness
- Button color state update on tap
- Sync queue write on every event

**Sprints 5–6: Review & budget**

- Daily review screen with event list
- Category reassignment interaction
- Amount entry and editing
- Budget setup and configuration UI
- Budget utilization display with heat indicator component

**Sprint 7: Polish & onboarding**

- Onboarding flow (category setup → routine config → widget placement guide)
- Empty states and error boundaries
- Performance profiling (tap latency validation)
- Internal alpha testing and bug bash

---

## 12. Risks & Mitigations

### High Severity

**Prediction accuracy erodes user trust**
If the button color is wrong too often, users lose confidence and stop tapping. A correction rate above 40% is a trust failure signal. Mitigation: ship with conservative, user-defined routines only; measure correction rate from day one; adaptive learning is a V2 priority.

**Sync conflict data corruption**
Multi-device offline edits to the same event can produce inconsistent state without deterministic conflict resolution. Mitigation: define merge rules per event type before shipping multi-device sync; write integration tests for every conflict scenario; use UUID-based deduplication server-side.

**SMS privacy backlash or app store rejection**
READ_SMS permission is sensitive and may trigger user distrust or app store policy review. Mitigation: explicit opt-in, local-only processing guarantee, prominent rationale screen, legal review before shipping. Treat SMS as a fully optional enhancement, never a core dependency.

### Medium Severity

**Message-bus operational complexity added too early**
Adopting a distributed streaming platform too early adds significant infrastructure overhead. Premature adoption before product-market fit can slow engineering velocity. Mitigation: prefer Redis-backed Laravel Queues and Horizon for V1; validate the event model with database-backed jobs before considering a streaming platform in later phases.

**"Dead-End" Pay-Once (LTD) customers**
Users who purchase a pay-once local license and never upgrade to cloud features can create ongoing support costs without generating recurring revenue. Mitigation: offer a limited maintenance window (e.g., 1 year) for major updates, include a short trial of cloud features with the one-time purchase, and design an upgrade path to subscription.

**P2P Sync complexity across devices**
Peer-to-peer sync over Bluetooth/Wi-Fi Direct is fragile across OEMs and OS versions and can generate support overhead. Mitigation: rely on battle-tested libraries (Ditto, ZeroTier), limit P2P to same-network discovery initially, and provide clear fallbacks to server-sync for edge cases.

**Projection lag creates stale dashboards**
If background job workers or projection tasks fall behind, budget summaries lag real spend. Mitigation: monitor job queue length and worker health as first-class metrics; surface a staleness indicator in the dashboard UI when projection data is more than N minutes old.

**AI hallucination in financial context**
AI-generated insights with incorrect numbers or amounts damage trust severely in a financial product. Mitigation: never allow the AI to invent numbers — always inject structured, precomputed data as context; enforce output schemas; add a fact-check pass before delivery.

### Low Severity

**iOS home-screen widget limitations**
WidgetKit widgets cannot execute code or make network calls on tap. Widget tap must deep-link into the app to complete logging, adding one step on iOS vs. Android. Mitigation: design the iOS flow to be as seamless as possible via deep-link; consider Action Button or Shortcuts shortcut as supplementary option.

---

## 13. Success Metrics

### Primary KPIs

| Metric                                                  | Target  |
| ------------------------------------------------------- | ------- |
| Average expense events logged per user per day          | ≥ 3     |
| Category correction rate (prediction quality indicator) | < 30%   |
| D14 retention of active family groups                   | > 70%   |
| Proportion of events logged via button vs. manual entry | > 80%   |
| Tap-to-logged latency (P95 devices)                     | < 100ms |
| DAU/MAU stickiness ratio for family groups              | > 0.4   |

### Secondary KPIs

- Budget adherence improvement: percentage of categories within budget in week 4 vs. week 1 baseline
- Family group sync success rate: > 99% of events successfully synced within 24 hours of creation
- AI insight engagement rate: open rate + action rate on AI push notifications (V2 baseline to be set at launch)
- Onboarding completion rate: percentage of installs that complete category setup and place the widget

### Anti-metrics (things to watch and minimize)

- Daily review abandonment rate (high = review UX is too heavy)
- Sync queue overflow events (indicates connectivity or retry logic issues)
- AI correction rate on auto-categorized SMS-matched events (indicates matching confidence tuning needed)

---

_If needed, the next artefacts in this series are: (1) Laravel job pipeline specification with job schemas and handlers, (2) multi-tenant database schema with index and enforcement design, and (3) SMS parsing and matching algorithm specification._
