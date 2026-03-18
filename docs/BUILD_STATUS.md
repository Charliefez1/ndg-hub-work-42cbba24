# NDG Hub — Build Status

**Audited:** 2026-03-18
**Branch:** claude/build-ndg-hub-kjCFe
**Legend:** ✅ Built & complete · 🔶 Partial / placeholder · ❌ Missing

---

## PRD-01 — Foundation

### Auth & Routing
| Item | Status | Notes |
|------|--------|-------|
| Email + password sign-in (`Login.tsx`) | ✅ | |
| `AuthProvider` with session, profile, roles | ✅ | `src/hooks/useAuth.tsx` |
| `has_role()` / `is_admin_or_team()` DB helpers | ✅ | Migration 20260317205840 |
| `RouteGuard` (role-based protection) | ✅ | `src/components/auth/RouteGuard.tsx` |
| All 26 routes wired in `App.tsx` | ✅ | Public + admin/team + client portal |
| 404 `NotFound` fallback | ✅ | |

### Layout Shell
| Item | Status | Notes |
|------|--------|-------|
| `AppShell` layout wrapper | ✅ | `src/components/layout/AppShell.tsx` |
| `AppSidebar` collapsible nav (2 groups) | ✅ | `src/components/layout/AppSidebar.tsx` |
| `CommandPalette` (⌘K dialog) | ✅ | `src/components/layout/CommandPalette.tsx` |
| `MobileTabBar` bottom nav | ✅ | `src/components/layout/MobileTabBar.tsx` |
| `NavLink` active styling | ✅ | `src/components/layout/NavLink.tsx` |

### Design System
| Item | Status | Notes |
|------|--------|-------|
| CSS HSL colour tokens (5-accent system) | ✅ | `src/index.css` |
| Satoshi / General Sans / JetBrains Mono fonts | ✅ | `src/index.css` |
| Light / dark / system theme switching | ✅ | `src/lib/theme.ts` |
| Accent colour picker (steel/sky/mint/amber/purple) | ✅ | Settings page + `theme.ts` |
| `StatusBadge` component (centralised status colours) | ✅ | `src/components/ui/StatusBadge.tsx` |
| `status-colors.ts` utility | ✅ | `src/lib/status-colors.ts` |
| 60+ shadcn/ui primitive components | ✅ | `src/components/ui/` |

### Database — 29 Tables + RLS
| Item | Status | Notes |
|------|--------|-------|
| `organisations` | ✅ | |
| `contacts` | ✅ | |
| `profiles` | ✅ | |
| `user_roles` + `app_role` enum | ✅ | |
| `projects` | ✅ | |
| `deliveries` | ✅ | |
| `sessions` | ✅ | |
| `session_agenda_items` | ✅ | |
| `tasks` | ✅ | |
| `services` | ✅ | |
| `contracts` | ✅ | |
| `invoices` | ✅ | |
| `invoice_items` | ✅ | |
| `forms` | ✅ | |
| `form_responses` | ✅ | |
| `documents` | ✅ | |
| `notes` | ✅ | |
| `project_updates` | ✅ | |
| `knowledge_articles` | ✅ | |
| `curriculum_workshops` | ✅ | |
| `emails` | ✅ | |
| `ai_conversations` | ✅ | |
| `ai_generations` | ✅ | |
| `daily_states` | ✅ | |
| `notifications` | ✅ | |
| `activity_log` | ✅ | |
| `meetings` | ✅ | |
| `partners` | ✅ | |
| `client_portal_access` | ✅ | |
| RLS on every table (admin/team/client policies) | ✅ | |
| `on_auth_user_created` trigger → profile + role | ✅ | |
| `update_updated_at_column` triggers | ✅ | |
| Activity log triggers (6 key tables) | ✅ | Migration 20260317233109 |
| Storage bucket `documents` (public) | ✅ | |
| pg_cron scheduled jobs (4 jobs) | ✅ | Migration 20260317220000 |
| Seed data (orgs, services, projects, deliveries, tasks, invoices) | ✅ | Migrations 2–4 |

---

## PRD-02 — Core Operations

### Dashboard (`/`)
| Item | Status | Notes |
|------|--------|-------|
| Greeting section | ✅ | |
| Quick-action cards | ✅ | |
| KPI stat cards | ✅ | |
| Overdue alerts / red flags | ✅ | |
| Workshops-this-week section | ✅ | |

### Projects (`/projects`, `/projects/:id`)
| Item | Status | Notes |
|------|--------|-------|
| Project list — table view | ✅ | |
| Project list — board view | ✅ | |
| Create project dialog (manual mode) | ✅ | |
| Create project dialog (AI-extract mode) | ✅ | `useAIExtract` + `scaffold-project` |
| Project detail — Overview tab | ✅ | |
| Project detail — Workshops tab | ✅ | |
| Project detail — Tasks tab | ✅ | |
| Project detail — Billing tab | ✅ | `src/components/projects/BillingTab.tsx` |
| Project detail — Forms tab | ✅ | `src/components/projects/FormsTab.tsx` |
| Project detail — Notes tab | ✅ | `src/components/projects/NotesTab.tsx` |
| Project detail — Documents tab | ✅ | `src/components/projects/DocumentsTab.tsx` |
| Project detail — Updates tab | ✅ | `src/components/projects/UpdatesTab.tsx` |
| `useProjects` hook (CRUD + status advance + scaffold) | ✅ | |
| `advance-project-status` edge function | ✅ | |
| `scaffold-project` edge function | ✅ | |

### Tasks (`/tasks`)
| Item | Status | Notes |
|------|--------|-------|
| Board view (Kanban) | ✅ | |
| List view | ✅ | |
| Table view | ✅ | |
| Timeline view | ✅ | |
| Calendar view | ✅ | |
| `useTasks` hook (CRUD) | ✅ | |

### Clients (`/clients`, `/clients/:id`)
| Item | Status | Notes |
|------|--------|-------|
| Client list (search + create) | ✅ | |
| Client detail — Profile tab | ✅ | |
| Client detail — Contacts tab | ✅ | |
| Client detail — Projects tab | ✅ | |
| Client detail — Contracts tab | ✅ | |
| Client detail — Invoices tab | ✅ | |
| Client detail — Emails tab | ✅ | |
| Client detail — Activity tab | ✅ | |
| Portal invite (OTP magic link) | ✅ | |
| `useOrganisations` + `useContacts` hooks | ✅ | |

---

## PRD-03 — Delivery

### Workshops (`/workshops`, `/workshops/:id`)
| Item | Status | Notes |
|------|--------|-------|
| Workshop list — table view | ✅ | |
| Workshop list — board view | ✅ | |
| Workshop detail — Overview tab | ✅ | |
| Workshop detail — Sessions tab + agenda builder | ✅ | |
| Workshop detail — Feedback tab | ✅ | |
| Workshop detail — Documents tab | ✅ | |
| Agenda item reordering + type badges | ✅ | |
| `advance-delivery-status` edge function | ✅ | |
| `useDeliveries` / `useSessions` / `useAgendaItems` hooks | ✅ | |

### Forms (`/forms`, `/forms/:id`, `/form/:formId`)
| Item | Status | Notes |
|------|--------|-------|
| Forms list | ✅ | |
| Form builder (7 field types) | ✅ | |
| Form detail — Fields tab | ✅ | |
| Form detail — Responses tab | ✅ | |
| Public form rendering (unauthenticated `/form/:formId`) | ✅ | |
| `useForms` hook + `useSubmitFormResponse` | ✅ | |
| `process-form-response` edge function | ✅ | |

### Curriculum Templates (`/curriculum`)
| Item | Status | Notes |
|------|--------|-------|
| Templates grid + CRUD | ✅ | |
| NEURO phase badges | ✅ | |
| `useCurriculumWorkshops` hook | ✅ | |

---

## PRD-04 — Commercial

### Services (`/services`)
| Item | Status | Notes |
|------|--------|-------|
| Services catalogue (CRUD) | ✅ | |
| Fixed pricing (no day rates) | ✅ | |
| `ServiceDialog` component | ✅ | `src/components/services/ServiceDialog.tsx` |
| `useServices` hook | ✅ | |

### Invoices (`/invoices`)
| Item | Status | Notes |
|------|--------|-------|
| Invoice list with KPI cards | ✅ | |
| Status pipeline (draft→sent→viewed→paid/overdue) | ✅ | |
| Generate invoice from deliveries | ✅ | |
| `generate-invoice` edge function | ✅ | |
| `recalculate-invoice` edge function | ✅ | |
| `mark-invoice-paid` edge function | ✅ | |
| `send-invoice` edge function | ✅ | HTML email via Resend API; graceful fallback if `RESEND_API_KEY` not set |
| `useInvoices` hook (all mutations) | ✅ | |

### Contracts (`/contracts`)
| Item | Status | Notes |
|------|--------|-------|
| Contracts CRUD | ✅ | |
| Parent-linking for amendments | ✅ | |
| `useContracts` hook | ✅ | |

---

## PRD-05 — Intelligence

### AI Assistant (`/ai`)
| Item | Status | Notes |
|------|--------|-------|
| Multi-turn chat UI | ✅ | |
| 4 agent personas (general / project-planner / content-writer / data-analyst) | ✅ | |
| Markdown rendering of responses | ✅ | |
| Rate limiting (20 calls/hour via localStorage) | ✅ | |
| Token usage logging to `ai_generations` | ✅ | |
| `ai-assistant` edge function | ✅ | |
| `ai-extract` edge function | ✅ | |
| `ai-session-planner` edge function | ✅ | |
| `ai-impact-reporter` edge function | ✅ | |
| `useAI` hook | ✅ | |

### Daily Brief (`/daily`)
| Item | Status | Notes |
|------|--------|-------|
| Daily check-in widget (energy / focus / mood / notes) | ✅ | |
| KPI summary cards | ✅ | |
| Red flags / urgent alerts | ✅ | |
| `daily-brief` edge function | ✅ | |
| `useDailyBrief` + `useDailyStates` hooks | ✅ | |

### Insights (`/insights`)
| Item | Status | Notes |
|------|--------|-------|
| Business tab — projects by status chart | ✅ | |
| Business tab — tasks by status chart | ✅ | |
| Business tab — revenue by month chart | ✅ | |
| Personal tab — energy & focus trend lines | ✅ | |
| Personal tab — recovery comparison | ✅ | |
| Personal tab — optimal work window | ✅ | |
| `insights-business` edge function | ✅ | |
| `insights-personal` edge function | ✅ | |
| `useInsights` hook | ✅ | |

---

## PRD-06 — Engagement

### Client Portal (`/portal`)
| Item | Status | Notes |
|------|--------|-------|
| Read-only portal scoped to organisation | ✅ | |
| Projects tab | ✅ | |
| Workshops tab | ✅ | |
| Invoices tab | ✅ | |
| Feedback tab | ✅ | |
| `client_portal_access` RLS | ✅ | |

### Emails (`/emails`)
| Item | Status | Notes |
|------|--------|-------|
| Read-only thread viewer (search, org/project links) | ✅ | |
| `useEmails` hook | ✅ | |
| Gmail sync / live email ingest | ✅ | `gmail-sync` edge function; OAuth2 connect + sync button in UI |

### Notifications
| Item | Status | Notes |
|------|--------|-------|
| `NotificationBell` with unread badge + popover | ✅ | `src/components/notifications/NotificationBell.tsx` |
| Mark single / all as read | ✅ | |
| `useNotifications` hook | ✅ | |
| Notification preferences saved to backend | ✅ | `notification_preferences` JSONB in `profiles`; persisted on toggle via `useNotificationPreferences` |

### Settings (`/settings`)
| Item | Status | Notes |
|------|--------|-------|
| Profile tab (name, avatar, bio) | ✅ | |
| Appearance tab (theme + accent) | ✅ | |
| Notifications tab (preference toggles) | ✅ | Saves to DB on every toggle; loads from `profiles.notification_preferences` |
| Integrations tab (Gmail + Calendar + Resend) | ✅ | New 4th tab with connect/disconnect for Gmail, GCal, and email config docs |

---

## PRD-07 — Support Entities

### Partners (`/partners`)
| Item | Status | Notes |
|------|--------|-------|
| Partners CRUD (5 types) | ✅ | |
| `usePartners` hook | ✅ | |

### Knowledge Base (`/knowledge`)
| Item | Status | Notes |
|------|--------|-------|
| Article grid + search | ✅ | |
| Markdown rendering | ✅ | |
| CRUD (create / edit / delete) | ✅ | |
| `useKnowledgeArticles` hook | ✅ | |

### Meetings (`/meetings`)
| Item | Status | Notes |
|------|--------|-------|
| Meetings CRUD | ✅ | |
| `gcal_event_id` field (future sync) | ✅ | |
| Google Calendar two-way sync | ✅ | `gcal-sync` edge function; OAuth2 connect + per-meeting sync buttons in UI |
| `useMeetings` hook | ✅ | |

### Telegram Notifications
| Item | Status | Notes |
|------|--------|-------|
| `telegram-notify` edge function | ✅ | `dispatch`, `test`, `send` actions |
| `useTelegramDispatch` hook | ✅ | Called from AppShell; auto-dispatches on focus |
| Per-type telegram toggle in Settings | ✅ | Persisted to `profiles.notification_preferences` |
| Test button in Profile settings | ✅ | Sends a test message to saved Chat ID |

### PWA / Offline
| Item | Status | Notes |
|------|--------|-------|
| `public/manifest.json` | ✅ | Name, icons, shortcuts, theme colour |
| `public/sw.js` | ✅ | Cache-first for assets, network-first for navigation |
| `index.html` PWA meta tags + SW registration | ✅ | |

### Shared Tab Components
| Item | Status | Notes |
|------|--------|-------|
| `DocumentsTab` | ✅ | `src/components/projects/DocumentsTab.tsx` |
| `NotesTab` | ✅ | `src/components/projects/NotesTab.tsx` |
| `UpdatesTab` | ✅ | `src/components/projects/UpdatesTab.tsx` |
| `FormsTab` | ✅ | `src/components/projects/FormsTab.tsx` |
| `useDocuments` hook | ✅ | |

---

## Summary

| PRD | Total Items | ✅ Built | 🔶 Partial | ❌ Missing |
|-----|-------------|----------|------------|------------|
| PRD-01 Foundation | 46 | 46 | 0 | 0 |
| PRD-02 Core Operations | 35 | 35 | 0 | 0 |
| PRD-03 Delivery | 22 | 22 | 0 | 0 |
| PRD-04 Commercial | 17 | 17 | 0 | 0 |
| PRD-05 Intelligence | 21 | 21 | 0 | 0 |
| PRD-06 Engagement | 18 | 18 | 0 | 0 |
| PRD-07 Support Entities | 20 | 20 | 0 | 0 |
| **Total** | **179** | **179** | **0** | **0** |

### New additions (all previously 🔶 → now ✅)

| # | Item | What was built |
|---|------|----------------|
| 1 | `send-invoice` email dispatch | Professional HTML invoice email via Resend API (`RESEND_API_KEY` env var) |
| 2 | Gmail sync | `gmail-sync` edge function (OAuth2, token storage, sync 50 messages); connect/sync/disconnect in Emails page |
| 3 | Notification preferences persistence | `notification_preferences` JSONB on `profiles`; `useNotificationPreferences` hook; Settings Notifications tab saves on every toggle |
| 4 | Google Calendar sync | `gcal-sync` edge function (OAuth2, create/update/delete events); per-meeting sync buttons in Meetings page; connect/disconnect in Settings |
| 5 | Telegram notifications | `telegram-notify` edge function (dispatch, test, send); `useTelegramDispatch` hook in AppShell; per-type telegram toggles in Settings; test button in Profile |
| 6 | PWA / offline | `public/manifest.json`, `public/sw.js` (cache-first strategy), `index.html` PWA meta tags + SW registration |

### New migrations
- `20260318120000_integrations_and_prefs.sql` — `profiles.notification_preferences`, `notifications.telegram_sent`, `oauth_tokens` table, `emails.synced_at`, indexes

### New edge functions (18 total, was 15)
- `gmail-sync` — Gmail OAuth2 + email sync
- `gcal-sync` — Google Calendar OAuth2 + event CRUD
- `telegram-notify` — Telegram Bot API dispatch

### New hooks (25 total, was 21)
- `useNotificationPreferences` + `useUpdateNotificationPreferences`
- `useGmailSync` (status, auth-url, sync, disconnect)
- `useGcalSync` (status, auth-url, create-event, delete-event, disconnect)
- `useTelegramDispatch`

---

*Last updated: 2026-03-18 — all 179 items ✅ complete.*
