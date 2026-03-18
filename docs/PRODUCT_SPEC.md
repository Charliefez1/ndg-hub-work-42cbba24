# NDG Hub — Product Specification

> Last updated: 2026-03-18

## 1. Product Overview

**NDG Hub** is an internal operations platform for a neurodiversity-focused learning & development consultancy. It manages the full lifecycle of client engagements — from contracting through delivery to impact evaluation — while providing AI-powered productivity tools and a self-service client portal.

### Target Users
| Role | Description |
|------|-------------|
| **Admin** | Business owner / ops lead — full system access |
| **Team** | Facilitators, project managers — operational access |
| **Client** | External client contacts — portal-only access |

### Core Value Propositions
1. **Single source of truth** for projects, workshops, invoices, and contracts
2. **Neuroscience-informed workflow** — NEURO phases, Kirkpatrick evaluation levels, energy/focus tracking
3. **Client transparency** — self-service portal for project status, invoices, and feedback
4. **AI augmentation** — multi-agent assistant for planning, content, and analytics
5. **Personal productivity** — daily check-ins, energy insights, optimal work window detection

### ADHD-Informed Design Rules
- No infinite scroll. No nested navigation. Everything visible without clicking.
- Checkboxes are big and satisfying. Colour-coded urgency throughout.
- Per-service pricing from a services catalogue with fixed prices. NO day rates.

---

## 2. User Journeys

### Journey 1: New Client Engagement
1. Admin creates **Organisation** with contacts
2. Admin creates **Contract** (MSA/SOW) linked to org
3. Admin creates **Project** — optionally pastes a proposal for AI extraction → preview → scaffold
4. System **scaffolds** deliveries, sessions, and feedback forms from the plan
5. Team configures **Workshop** sessions and agenda items
6. Team creates **Feedback forms** linked to deliveries
7. Admin **generates invoice** by selecting uninvoiced deliveries → generate-invoice creates invoice + items from service prices
8. Admin sends invoice; marks paid when settled

### Journey 2: Workshop Delivery
1. Team advances delivery status: `planning → scheduled → in_progress`
2. Team builds session agendas using **curriculum templates**
3. AI Session Planner can auto-generate agenda items
4. Workshop delivered; status → `delivered`
5. Feedback form link shared with delegates
6. Responses collected; satisfaction scores calculated
7. AI Impact Reporter generates impact summary
8. Status → `follow_up` → `complete`

### Journey 3: Client Portal Access
1. Admin grants portal access (creates `client_portal_access` row)
2. Client signs up / signs in → routed to `/portal`
3. Client views: project status, workshop schedule, invoices
4. Client submits feedback forms for completed workshops
5. No ability to modify any data — read-only + form submission

### Journey 4: Daily Operations
1. Team member opens **Daily Brief**
2. Logs energy, focus, mood via check-in widget
3. Reviews focus tasks and upcoming workshops
4. AI-generated red flags surface urgent items
5. Over time, **Personal Insights** reveal energy patterns and optimal work windows

---

## 3. Information Architecture

```
NDG Hub
├── Dashboard (/)
├── Core
│   ├── Daily Brief (/daily)
│   ├── Projects (/projects)
│   ├── Tasks (/tasks)
│   ├── Clients (/clients)
│   └── Insights (/insights)
├── Delivery
│   ├── Workshops (/workshops)
│   ├── Meetings (/meetings)
│   └── Curriculum (/curriculum)
├── Commercial
│   ├── Invoices (/invoices)
│   └── Contracts (/contracts)
├── Engage
│   ├── Forms (/forms)
│   ├── Emails (/emails)
│   └── Client Portal (/portal)
├── Admin
│   ├── Services (/services)
│   ├── Partners (/partners)
│   ├── Knowledge Base (/knowledge)
│   ├── AI Assistant (/ai)
│   └── Settings (/settings)
└── Global
    └── ⌘K Command Palette
```

### Mobile Navigation
- Bottom tab bar: Home / Projects / Tasks / Invoices
- "More" sheet for full nav

---

## 4. Data Model Relationships

```
Organisation ──┬── Projects ──┬── Deliveries ──┬── Sessions ── Agenda Items
               │              │                ├── Tasks
               │              │                ├── Forms ── Responses
               │              │                └── Documents
               │              ├── Tasks
               │              ├── Invoices ── Invoice Items
               │              ├── Notes
               │              └── Project Updates
               ├── Contacts
               ├── Contracts
               ├── Meetings
               └── Emails

Services ←── Deliveries, Curriculum Workshops, Invoice Items
Partners (standalone)
Knowledge Articles (standalone)
Daily States ←── User (personal tracking)
AI Conversations / Generations ←── User
```

---

## 5. Status Pipelines

### Project Status
| Stage | Meaning |
|-------|---------|
| `contracting` | Agreement being finalised |
| `project_planning` | Scope and timeline being defined |
| `session_planning` | Workshop sessions being designed |
| `content_review` | Materials being reviewed |
| `delivery` | Workshops in progress |
| `feedback_analytics` | Collecting/analysing feedback |
| `closed` | Engagement finished |

### Delivery Status
| Stage | Meaning |
|-------|---------|
| `planning` | Workshop being scoped |
| `scheduled` | Date/venue confirmed |
| `in_progress` | Workshop underway or materials being prepared |
| `delivered` | Workshop completed |
| `follow_up` | Post-delivery follow-up in progress |
| `complete` | All follow-up done |
| `cancelled` | Voided |

### Invoice Status
| Stage | Meaning |
|-------|---------|
| `draft` | Being prepared |
| `sent` | Issued to client |
| `viewed` | Client has viewed |
| `paid` | Payment received |
| `overdue` | Past due date |

### Contract Status
| Stage | Meaning |
|-------|---------|
| `draft` | Being prepared |
| `sent` | Sent for review |
| `signed` | Fully executed |
| `expired` | Past end date |
| `cancelled` | Voided |

---

## 6. AI Capabilities

### Multi-Agent Chat
| Agent | Capabilities |
|-------|-------------|
| General Assistant | Query project data, answer questions |
| Project Planner | Scope projects, suggest timelines |
| Content Writer | Draft workshop content, materials |
| Data Analyst | Analyse feedback trends, business metrics |

### Automated Functions
- **AI Extract (Create from Plan):** Paste a proposal → AI extracts project structure → preview modal → scaffold
- **Session Planner:** Generate agenda items from workshop description
- **Impact Reporter:** Create impact reports from feedback data
- **Daily Brief:** Surface red flags and priorities
- **Data Extraction:** Parse unstructured text into structured fields

### Personal Analytics
- 30-day energy and focus trends
- Day-of-week performance patterns
- Delivery vs non-delivery day recovery comparison
- Optimal work window recommendation

---

## 7. Security Model

| Principle | Implementation |
|-----------|---------------|
| Authentication | Email + password via Supabase Auth |
| Authorization | Row-Level Security on every table |
| Role separation | `user_roles` table (not in profiles) |
| Client isolation | `client_portal_access` scopes data to org |
| Audit trail | Automatic `activity_log` via database triggers |
| No client-side role checks | All authorization server-side via RLS |

---

## 8. NEURO Framework Integration

NDG Hub embeds the NEURO neuroscience framework throughout:

### 5 NEURO Phases
| Phase | Meaning |
|-------|---------|
| `needs` | Needs assessment and discovery |
| `engage` | Stakeholder engagement and buy-in |
| `understand` | Deep learning and understanding |
| `realise` | Applying learning to realise outcomes |
| `ongoing` | Sustained change and continuous improvement |

- **Sessions and deliveries** tagged with NEURO phases
- **Kirkpatrick Levels:** Forms and responses tagged with evaluation levels (1–4: Reaction → Results)
- **Energy/Focus Tracking:** Daily states capture cognitive capacity
- **Optimal Windows:** AI analyses patterns to recommend peak performance times
- **Recovery Metrics:** Compare energy on delivery vs non-delivery days

---

## 9. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Page load (FCP) | < 2s |
| Responsive breakpoints | Mobile-first, sidebar collapses < 768px |
| Dark mode | Full support via CSS custom properties |
| Offline | Not supported (requires live DB connection) |
| Browser support | Modern evergreen browsers |
| Data limit | 1000 rows per query (Supabase default) |
| File storage | Public bucket, no size limit enforced in app |

---

## 10. Future Considerations

- Google Calendar sync (field exists: `gcal_event_id`)
- Gmail integration (table exists: `emails`)
- QuickBooks sync (field exists: `quickbooks_id`)
- Telegram notifications (field exists: `telegram_chat_id`)
- Partner-specific workshop variants (field exists: `partner_variants`)
- Real-time collaboration via Supabase Realtime
- Mobile-optimised views / PWA
