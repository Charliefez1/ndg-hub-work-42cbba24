# NDG Hub v2 — System Architecture

---

## System Overview

NDG Hub v2 is a single-tenant internal work management platform for Neurodiversity Global, a UK neurodiversity consulting firm. At its core, it manages projects, tasks, clients, and daily operations. Delivery workflows (workshops, sessions, feedback), invoicing, AI features, and a client portal extend from that project/task management foundation.

**Boundaries:** NDG Hub is not a CRM (Clarify handles sales), not a full email client (Gmail sync for context only), not an accounting system (QuickBooks handles books). It is the operational hub where work gets planned, tracked, and managed.

**Key stakeholders:** Charlie (co-founder, business ops), Rich (co-founder, delivery), Associates (contracted facilitators), Client contacts (via portal).

---

## Context Diagram (C4 Level 1)

```
┌─────────────────────────────────────────────────────────────┐
│                        NDG Hub v2                           │
│  (React SPA + Supabase Backend + Edge Functions)            │
└──────────┬──────────┬──────────┬──────────┬────────────────┘
           │          │          │          │
     ┌─────▼───┐ ┌───▼────┐ ┌──▼───┐ ┌───▼──────┐
     │ Google  │ │ Google │ │Claude│ │QuickBooks│
     │Calendar │ │ Gmail  │ │ API  │ │  (P3)    │
     └─────────┘ └────────┘ └──────┘ └──────────┘
           │          │          │          │
     ┌─────▼───┐ ┌───▼────┐ ┌──▼───┐ ┌───▼──────┐
     │Telegram │ │Clarify │ │ n8n  │ │Perplexity│
     │  Bot    │ │CRM(P3) │ │(P2)  │ │ /Fire(P3)│
     └─────────┘ └────────┘ └──────┘ └──────────┘
```

**Users access via:** Browser (desktop primary, mobile usable). Client portal users access via magic link.

---

## Container Diagram (C4 Level 2)

```
┌──────────────────────────────────────────────────────────┐
│                      BROWSER                              │
│  ┌────────────────────────────────────────────────────┐  │
│  │           React SPA (Vite + TypeScript)             │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │  │
│  │  │  Pages   │ │  Hooks   │ │   shadcn/ui + TW    │ │  │
│  │  │(14 P1)   │ │useAI     │ │   Design Tokens     │ │  │
│  │  │          │ │useQuery  │ │                      │ │  │
│  │  └──────────┘ └──────────┘ └────────────────────┘ │  │
│  └───────────────────┬────────────────────────────────┘  │
└──────────────────────┼───────────────────────────────────┘
                       │ HTTPS / WSS
┌──────────────────────┼───────────────────────────────────┐
│                 SUPABASE CLOUD                            │
│  ┌───────────────────▼────────────────────────────────┐  │
│  │              Supabase API Gateway                   │  │
│  │         (Auth + PostgREST + Realtime)               │  │
│  └──────┬─────────────┬──────────────┬────────────────┘  │
│  ┌──────▼──────┐ ┌────▼─────┐ ┌──────▼──────────────┐   │
│  │  Postgres   │ │  Auth    │ │  Edge Functions      │   │
│  │  (26 tables)│ │ (3 roles)│ │  (16 in Phase 1)     │   │
│  │  + RLS      │ │          │ │  + Claude API calls   │   │
│  │  + pg_cron  │ │          │ │                       │   │
│  └─────────────┘ └──────────┘ └───────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## Component Catalogue

### Frontend Components

| Module | Purpose | Does | Does NOT |
|---|---|---|---|
| **AppShell** | Layout wrapper | Renders sidebar + main content area + mobile nav. Handles route guards. | Handle data fetching, auth logic. |
| **Sidebar** | Navigation | Renders nav groups with icons, phase badges, active state. Collapses on mobile. | Fetch data. It reads route state only. |
| **PageHeader** | Page title bar | Renders title, subtitle, route badge. Sticky. | Navigate or fetch. |
| **ProjectDetail** | Project view | Tabbed layout (8 tabs). Orchestrates child components. Provides AI context. | Direct DB writes. Delegates to hooks + Edge Functions. |
| **WorkshopDetail** | Delivery view | Tabbed layout (4 tabs). Renders sessions + agenda builder. | Calculate satisfaction scores. That's Edge Function work. |
| **AgendaBuilder** | Session planning | Renders timed blocks. Drag-to-reorder. Inline edit. Running time total. | AI generation. That's the "Plan Session" button → `useAI`. |
| **FormBuilder** | Form creation | JSON-driven field editor. Drag-to-reorder. Field type picker. Preview tab. | Form submission processing. That's `process-form-response`. |
| **PublicForm** | Form submission | Renders form fields from JSONB. No auth. Submits to Edge Function. | Anything else. Standalone public page. |
| **AIAssistant** | /ai page | Chat interface. Agent selector. Thread list. Streaming markdown. | Direct DB operations. Structured outputs go through preview → confirm. |
| **AICopilotDrawer** | Contextual AI (P2) | Slide-in drawer. Inherits page context. Chat + actions. | Exists in P2 only. Not built in Phase 1. |
| **InvoiceGenerator** | Invoice creation | Select deliveries → preview line items → confirm → call Edge Function. | Calculate totals client-side. Edge Function does the math. |
| **StatusBadge** | Status display | Renders pill badge with correct colour from `getStatusColor()`. | Hard-code colours. Always uses the utility. |

### Shared Hooks

| Hook | Purpose | Interface |
|---|---|---|
| `useAI` | All AI interactions | `{send, cancel, isStreaming, response, error}`. Params: agent, context, prompt. Handles streaming SSE, caching, rate limiting, structured output parsing. |
| `useAIContext` | Page context for AI | Sets context (entity_type, entity_id, data snapshot). Auto-attaches to `useAI` calls. |
| `useProjects` | Project CRUD | TanStack Query wrappers. `useProjects()`, `useProject(id)`, `useCreateProject()`, `useUpdateProject()`. |
| `useDeliveries` | Delivery CRUD | Same pattern. Includes `useAdvanceDeliveryStatus()` which calls Edge Function. |
| `useTasks` | Task CRUD | Same pattern. Optimistic updates for status changes. |
| `useInvoices` | Invoice ops | `useGenerateInvoice()`, `useRecalculateInvoice()`, `useSendInvoice()`, `useMarkPaid()`. |
| `useForms` | Form + response ops | `useFormBuilder()`, `useSubmitResponse()` (calls Edge Function). |
| `useDailyBrief` | Daily brief data | Calls `dailyBrief` Edge Function. Returns structured daily data. |
| `useInsights` | Insights data | Calls `insightsBusiness` + `insightsPersonal`. Returns chart-ready data. |

### Edge Functions

| Function | Input | Output | Side Effects |
|---|---|---|---|
| `scaffold-project` | org_id, name, deliveries[] | Created project + children | activity_log |
| `scaffold-deliveries` | project_id, deliveries[] | Created deliveries + sessions | activity_log |
| `generate-invoice` | project_id, delivery_ids[] | Invoice + items | activity_log |
| `recalculate-invoice` | invoice_id | Updated invoice totals | — |
| `process-form-response` | form_id, data | Saved response | Updates delivery.satisfaction_score, notification, activity_log |
| `advance-project-status` | project_id, new_status | Updated project | Validates transition, notification, activity_log |
| `advance-delivery-status` | delivery_id, new_status | Updated delivery | Validates, triggers feedback/satisfaction/GCal, notification, activity_log |
| `send-invoice` | invoice_id | Updated invoice | Sets dates, notification |
| `mark-invoice-paid` | invoice_id | Updated invoice | Sets paid_date, notification, checks project closability |
| `dailyBrief` | user_id | Structured daily data | — |
| `insightsBusiness` | — | Chart data | — |
| `insightsPersonal` | user_id | Chart data | — |
| `ai-assistant` | agent, prompt, context | Streaming SSE | Saves to ai_conversations |
| `ai-session-planner` | delivery context | Agenda items JSON | Saves to ai_generations |
| `ai-impact-reporter` | form + delivery data | Impact report | Saves to ai_generations |
| `ai-extract` | unstructured text | Structured JSON | Saves to ai_generations |

---

## Data Architecture

### Entity Hierarchy

```
Organisation (client company)
  ├── Contact (person at org) — tab on Client Detail
  └── Project (engagement)
        ├── status: 7-stage operational lifecycle [Axis 1]
        ├── intended_neuro_phase: metadata hint [Axis 2 hint]
        │
        ├── Delivery (UI: "Workshop")
        │     ├── neuro_phase [Axis 2 — LIVES HERE]
        │     ├── kirkpatrick_level [Axis 3 — LIVES HERE]
        │     ├── service_id → services (price)
        │     ├── Session (time block)
        │     │     └── AgendaItem (timed block: intro/activity/break/debrief/energiser)
        │     └── sort_order (drag-to-reorder)
        │
        ├── Form → FormResponse
        ├── Invoice → InvoiceItem
        ├── Task (also links to delivery)
        ├── ProjectUpdate (status updates)
        ├── Note (scratchpad)
        ├── Email (Gmail sync, P2)
        ├── Contract (MSA/PO/SOW, P2)
        └── Document (polymorphic attachments)
```

### State Machines

**Project Status (7 stages):**
```
contracting → project_planning → session_planning → content_review → delivery → feedback_analytics → closed
```
Enforced by `advance-project-status`. No skipping. `→ closed` requires all invoices paid.

**Delivery Status (6 stages + cancelled):**
```
planning → scheduled → in_progress → delivered → follow_up → complete
                                                              (cancelled from any)
```
`→ scheduled` requires date + facilitator. `→ delivered` triggers feedback. `→ complete` calculates satisfaction.

**Invoice Status:**
```
draft → sent → viewed → paid
                  └──→ overdue (set by daily cron if past due_date)
```

**Session Content Status:**
```
draft → ready_for_review → approved → delivered
```

### Pricing Flow

```
services.price ──→ deliveries.service_id ──→ invoice_items.unit_price ──→ invoice.subtotal + VAT = total
```

No day rates. No time tracking for billing. Price is fixed per service, copied at invoice time.

---

## Cross-Cutting Concerns

### Security Model
- **Auth:** Supabase Auth. Email/password (admin + team). Magic link (client).
- **Authorisation:** RLS on every table. 3 roles: admin (full), team (read all + write assigned), client (read own org).
- **API keys:** Stored in Supabase Edge Function secrets. Never client-side.
- **CORS:** Supabase handles CORS. No custom backend.

### Error Handling
- **Edge Functions:** Return `{data, error}` shape. HTTP status codes: 400, 401, 404, 500.
- **React:** TanStack Query `isError` → inline error banner + retry. Toast for transient errors. Persistent banner for auth.
- **Optimistic updates:** Task status, form submissions, notes. Rollback via `onError`.

### Logging & Audit
- **activity_log table:** Every create, update, status_change logged with user_id, entity_type, entity_id, action, metadata.
- **AI usage:** ai_generations tracks every AI call with tokens_used, model, entity context.
- **No console.log in production.** Use structured logging in Edge Functions only.

### Performance
- **Client:** TanStack Query caching (staleTime: 30s for lists, 5min for static data like services). Lazy loading for detail views.
- **Edge Functions:** < 500ms target for non-AI operations. Database queries with proper indexes.
- **AI:** Streaming SSE so first token appears < 1s. Full response may take 5-15s.
- **Images/Assets:** Supabase Storage. No large assets in the DB.

---

## Architecture Decision Records

### ADR-1: No business logic in React
- **Decision:** All multi-table operations, computed values, and status transitions go through Edge Functions.
- **Alternatives:** V1 had all logic in React components. Failed catastrophically.
- **Rationale:** Edge Functions are transactional, testable, and enforce rules regardless of client. React only renders.

### ADR-2: service_id on deliveries, not service_type on projects
- **Decision:** Each delivery links to a service via `service_id`. Projects have no service field.
- **Alternatives:** V1 PRD had `service_type` enum on projects.
- **Rationale:** A single project can contain multiple service types (awareness workshop + consultancy). Service must live at the delivery level.

### ADR-3: neuro_phase on deliveries, not projects
- **Decision:** `neuro_phase` is a field on `deliveries`, not `projects`. Projects get `intended_neuro_phase` as a non-binding hint.
- **Alternatives:** V1 put NEURO phase on projects.
- **Rationale:** One project can have deliveries in different phases simultaneously (an "Engage" awareness workshop and an "Understand" manager session).

### ADR-4: Claude API via Edge Functions, not client-side
- **Decision:** All AI calls go through Edge Functions. Claude API key never reaches the browser.
- **Alternatives:** V1 used Lovable AI Gateway with Gemini.
- **Rationale:** Security (API key protection), rate limiting (server-enforced), caching (ai_generations table), and model control (Sonnet vs Haiku per use case).

### ADR-5: Unified useAI hook, not per-feature AI logic
- **Decision:** Single `useAI` hook handles all AI interactions across the platform.
- **Alternatives:** V1 had 4 separate implementations (AIAssistant, ProjectDetail, CreateFromPlan, AIChatPanel).
- **Rationale:** DRY. Consistent streaming, error handling, caching, and rate limiting everywhere.

### ADR-6: Per-service pricing, not day rates
- **Decision:** Services catalogue has fixed prices. Invoice = sum of service prices. No day_rate or total_days.
- **Alternatives:** V1 PRD had day_rate on projects.
- **Rationale:** NDG doesn't bill by day. They bill per workshop/service delivered. Confirmed by founder.

### ADR-7: Magic link for portal, not password
- **Decision:** Client portal users authenticate via magic link email.
- **Alternatives:** Username/password, SSO, shared link.
- **Rationale:** Lowest friction for client contacts who access infrequently. No password to remember. Supabase Auth supports it natively.

---

## Infrastructure

- **Hosting:** Supabase Cloud (managed Postgres, Auth, Edge Functions, Realtime, Storage).
- **Frontend hosting:** Lovable Cloud (auto-deployed from Lovable builds).
- **Domain:** Custom domain pointing to Lovable deployment.
- **CI/CD:** Lovable handles builds. No custom pipeline needed for V2.
- **Environments:** Development (local Supabase via CLI) + Production (Supabase Cloud).
- **Backups:** Supabase daily backups (included in Pro plan).
- **Monitoring:** Supabase dashboard for DB metrics, Edge Function logs, Auth events. No external monitoring for V2.

---

*This architecture doc is the source of truth for HOW the system is structured. For WHAT we're building, see PRD.md. For build sequence, see PLAN.md. For AI coding rules, see AI_BUILDER_RULES.md.*
