

## Plan: Comprehensive Upgrade — Dashboard, Portal, Automation & New Features

This plan covers all four areas in a single coordinated pass, designed to be implemented in order.

---

### Part 1: Dashboard Redesign

**Current state**: Basic KPI cards, overdue alerts, upcoming workshops, recent projects. Functional but flat.

**Upgrade**:

1. **Activity Feed Widget** — New card showing the latest 10 entries from `activity_log`, with human-readable labels (e.g. "Project 'NHS Trust Q4' moved to delivery"), relative timestamps, and entity-type icons. Clickable rows link to the relevant detail page.

2. **Focus Mode Quick-Start** — Small inline widget showing today's top 3 priority tasks (sorted by priority then due_date) with one-click "Start Focus" that navigates to `/tasks` with the task pre-selected in focus mode. Shows energy/focus from today's daily state if checked in.

3. **Revenue Sparkline** — Replace the static "Revenue (Paid)" KPI with a mini sparkline (Recharts `<Sparkline>`) showing monthly paid totals for the last 6 months. Data derived client-side from existing invoice query.

4. **Pipeline Summary Row** — Horizontal strip below KPIs showing project count per pipeline stage as small colored dots/pills (like the Partners redesign pattern). Instant portfolio health view.

5. **Greeting Enhancement** — Show the user's current mood emoji (from today's daily state) next to their name if they've checked in.

**Files**: `src/pages/Index.tsx` (rewrite), new `src/components/dashboard/ActivityFeed.tsx`, `src/components/dashboard/PipelineStrip.tsx`

---

### Part 2: Client Portal Upgrade

**Current state**: Read-only tabs for projects, workshops, invoices, feedback, analytics. Minimal interactivity.

**Upgrade**:

1. **Project Timeline View** — Replace flat project cards with a visual timeline showing project status as a horizontal progress bar across pipeline stages. Each stage is a dot; completed stages are filled, current is pulsing.

2. **Document Access** — New "Documents" tab pulling from `documents` table filtered by the client's project IDs. Requires adding `can_view_documents` permission check (already in the permissions JSONB default). Shows file name, upload date, and download link.

3. **Workshop Prep Card** — For workshops with status `confirmed` or `scheduled`, show a prep card with location, date, delegate count, and any attached session agenda. Helps clients prepare.

4. **Invoice Download** — Add a "Download" button on each invoice row that links to the invoice PDF (from `generate-invoice` edge function or stored document URL).

5. **Satisfaction Score Display** — On the Analytics tab, show average satisfaction score across completed deliveries as a large number with a circular progress indicator.

**Files**: `src/pages/Portal.tsx` (major update), new `src/components/portal/ProjectTimeline.tsx`

---

### Part 3: Workflow Automation

**Current state**: `process-automations` edge function handles overdue alerts, stale nudges, workload alerts, and invoice reminders. All triggered manually or via cron. No status-change triggers.

**Upgrade**:

1. **Database Triggers for Status Changes** — Create three `AFTER UPDATE` triggers on `projects`, `deliveries`, and `invoices` tables that fire when `status` changes. Each calls `log_activity()` (already exists) and inserts into a new `automation_queue` table.

2. **Automation Queue Table** — New table: `automation_queue(id, entity_type, entity_id, old_status, new_status, processed, created_at)`. Status-change triggers insert here. The `process-automations` function picks up unprocessed rows.

3. **Pipeline Auto-Advance Rules**:
   - When ALL deliveries in a project reach `complete` → auto-advance project to `feedback_analytics`
   - When a project moves to `delivery` → trigger `superagent-deal-won` (onboarding tasks)
   - When an invoice moves to `sent` and `due_date` is set → schedule a reminder notification 3 days before due
   - When a delivery moves to `delivered` → auto-create feedback form if none exists

4. **Cron Job Setup** — Schedule `process-automations` to run every 15 minutes via `pg_cron`, processing the automation queue and existing time-based checks.

5. **Automation Log UI** — New section in Settings showing recent automation actions (read from `activity_log` where action starts with automation types). Simple table, no editing.

**Database changes**: New `automation_queue` table + 3 triggers. Migration required.
**Files**: `supabase/functions/process-automations/index.ts` (extend), `src/pages/Settings.tsx` (add automation log tab)

---

### Part 4: New Feature — Command Palette Enhancement

**Current state**: `CommandPalette.tsx` exists but scope is unclear.

**Upgrade**:
1. **Global Search** — ⌘K searches across projects, tasks, organisations, and contacts simultaneously using parallel Supabase queries with `.ilike()`.
2. **Quick Actions** — "Create Task", "Create Project", "New Meeting" actions directly from the palette.
3. **Recent Pages** — Track last 5 visited pages in localStorage, show as "Recent" section.

**Files**: `src/components/layout/CommandPalette.tsx` (rewrite)

---

### Implementation Order

| Step | Scope | Estimated complexity |
|------|-------|---------------------|
| 1 | Database migration: `automation_queue` table + triggers | Small |
| 2 | Dashboard redesign (activity feed, pipeline strip, sparkline) | Medium |
| 3 | Process-automations extension (queue processing + auto-advance) | Medium |
| 4 | Client Portal upgrade (timeline, documents, prep cards) | Medium |
| 5 | Command Palette global search | Small |
| 6 | Cron job setup for automations | Small |
| 7 | Settings automation log | Small |

### Technical Notes

- Activity feed uses existing `activity_log` table — no schema changes needed
- Revenue sparkline uses Recharts (already a dependency)
- Portal document access controlled by existing `can_view_documents` permission in JSONB
- Automation triggers use `SECURITY DEFINER` to bypass RLS when inserting queue rows
- All new components follow existing patterns: hooks for data, AppShell for layout, stagger-in animations

