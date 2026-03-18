# NDG Hub — Feature Specification

> Last updated: 2026-03-18

## 1. Authentication & Access

### Login / Sign Up (`/login`)
- Email + password sign-in and sign-up forms
- Auto-confirm enabled (immediate access after sign-up)
- Role-based redirect: `client` → `/portal`, `admin`/`team` → `/`
- Loading spinner during auth state resolution

### Route Guards
- Admin/team routes: `<RouteGuard allowedRoles={['admin', 'team']}>`
- Client portal: `<RouteGuard allowedRoles={['client']}>`
- Unauthenticated users redirected to `/login`

---

## 2. Dashboard (`/`)

- Time-based greeting (Good morning/afternoon/evening)
- **Quick actions:** Navigate to Projects, Tasks, Workshops, Invoices
- **KPI cards:** Active Projects, Pending Tasks, Upcoming Workshops, Revenue (paid invoices)
- **Overdue Tasks alert:** Red card listing tasks past due date
- **Workshops This Week:** Upcoming deliveries within 7 days
- **Recent Projects:** Latest 5 projects with status badges

---

## 3. Services (`/services`)

- CRUD table for service catalogue
- Fields: name, category, price, duration, neuro phase, description, active toggle
- Inline edit and delete via dropdown menu
- Dialog form for create/edit

---

## 4. Clients (`/clients`, `/clients/:id`)

### Client List
- Searchable table of organisations
- Columns: name, sector, status, contact count
- Create dialog with name, sector, email, phone, website, address fields

### Client Detail
- Overview card with org info
- Tabs: Contacts, Projects, Activity Log
- Contact management (add/edit/delete contacts)
- Activity log showing auto-logged CRUD actions

---

## 5. Projects (`/projects`, `/projects/:id`)

### Project List
- Filterable grid of project cards
- Status badges with colour coding
- Create dialog linked to organisation

### Project Detail
- **Header:** Project name, status badge, "Advance" button (status pipeline)
- **Tabs:**
  - **Overview:** Start/end dates, budget, org, external ref, notes
  - **Workshops:** List of deliveries with status, date, location
  - **Tasks:** Filtered task list for this project
  - **Billing:** Invoice list + generate invoice action
  - **Forms:** Linked feedback/intake forms
  - **Notes:** Personal notes (per-user, Markdown)
  - **Documents:** File upload to storage bucket + URL linking
  - **Updates:** Status update feed (manual + AI-generated)

### Status Pipeline
`contracting → scheduling → content_development → ready → delivering → evaluating → complete`

---

## 6. Workshops (`/workshops`, `/workshops/:id`)

### Workshop List
- All deliveries across projects
- Filter by status, date range
- Status badges

### Workshop Detail
- **Header:** Title, status, advance button
- **Tabs:**
  - **Overview:** Date, location, duration, delegate count, facilitator, neuro phase
  - **Sessions:** Expandable session list with agenda builder
    - Add/reorder/delete agenda items (title, type, duration, method, materials)
  - **Feedback:** Linked form responses with satisfaction scores + public form link
  - **Documents:** File upload + URL linking

### Status Pipeline
`planning → confirmed → materials_sent → delivered → feedback_collected`

---

## 7. Tasks (`/tasks`)

### Views (5)
- **Board:** Kanban columns by status (todo, in_progress, review, done)
- **List:** Priority-sorted with quick status toggles
- **Table:** Sortable columns with inline status dropdown + delete
- **Timeline:** Grouped by week based on due date
- **Calendar:** Monthly grid showing tasks per day

### Task Fields
title, description, project, priority (low/medium/high/urgent), status, due date, assignee, delivery link, parent task

---

## 8. Forms (`/forms`, `/forms/:id`, `/form/:formId`)

### Form Builder
- CRUD list of forms (feedback, intake types)
- Dynamic field editor (JSON-based `fields` column)
- Link to project and/or delivery
- Active/inactive toggle
- Kirkpatrick level tagging

### Public Form (`/form/:formId`)
- Unauthenticated access to active forms
- Dynamic rendering from field definitions
- Response submission (public INSERT via RLS)

---

## 9. Invoices (`/invoices`)

- KPI cards: Total Revenue, Outstanding, Drafts
- Invoice table with status badges
- Quick "Mark Paid" action
- Fields: invoice number, project, org, subtotal, VAT, total, dates, status
- Edge functions: generate, recalculate, mark paid, send

---

## 10. Contracts (`/contracts`)

- CRUD table for legal agreements
- Fields: title, type (MSA/SOW/amendment), organisation, project, value, dates, status
- Parent contract linking (amendments reference parent)
- Status: draft, active, expired, terminated

---

## 11. Meetings (`/meetings`)

- CRUD table for scheduled meetings
- Fields: title, type, scheduled time, duration, location, organisation, project, contact, notes, attendees
- Google Calendar event ID field (for future sync)

---

## 12. Partners (`/partners`)

- CRUD table for delivery/referral partners
- Fields: name, type, contact email, commission rate

---

## 13. Knowledge Base (`/knowledge`)

- CRUD list of internal wiki articles
- Fields: title, content (Markdown), category, tags
- Search by title/content/tags
- Markdown preview

---

## 14. Emails (`/emails`)

- Read-only viewer for tracked Gmail threads
- Search by subject, sender, snippet
- Fields: subject, from, to, snippet, received date, linked org/project
- Thread grouping by `thread_id`

---

## 15. Curriculum Templates (`/curriculum`)

- CRUD management for reusable workshop agendas
- Fields: title, neuro phase, linked service, default agenda (JSON), materials (JSON), partner variants (JSON)
- Used when scaffolding new workshop deliveries

---

## 16. Daily Brief (`/daily`)

- **KPI cards:** Due Today, Overdue, Completed Today, Upcoming Workshops
- **Daily Check-in widget:** Energy slider, Focus slider, Mood selector, Notes textarea
  - Upserts to `daily_states` table
- **Focus Tasks:** Today's due tasks
- **Upcoming Workshops:** Next 7 days
- **Red Flags:** AI-generated alerts from `daily-brief` edge function
- **Overdue Tasks:** Full overdue list

---

## 17. Insights (`/insights`)

### Business Tab
- Projects by Status (Pie chart)
- Tasks by Status (Pie chart)
- Revenue by Month (Bar chart)

### Personal Tab
- Energy & Focus over Time (Line chart, 30 days)
- Focus by Day of Week (Bar chart)
- Recovery comparison: delivery vs non-delivery days
- Optimal Work Window recommendation
- Data powered by `insights-personal` edge function

---

## 18. AI Assistant (`/ai`)

- Multi-agent chat interface
- **Agents:** General Assistant, Project Planner, Content Writer, Data Analyst
- Markdown response rendering
- Conversation history saved to `ai_conversations`
- Usage tracking in `ai_generations`
- Rate limiting display

---

## 19. Settings (`/settings`)

- **Profile tab:** Display name, Telegram chat ID
- **Appearance tab:** Theme switcher (light/dark/system), accent colour picker
- **Notifications tab:** Toggle preferences (placeholder)

---

## 20. Notifications

- Bell icon in sidebar header
- Popover dropdown with notification list
- Unread count badge
- Mark individual / mark all as read
- Types: info, warning, success, error

---

## 21. Client Portal (`/portal`)

- Separate layout (no sidebar, portal header)
- Accessible only to users with `client` role
- Scoped to organisations via `client_portal_access` table
- **Tabs:**
  - **Projects:** Read-only list of org's projects with status
  - **Workshops:** Read-only list of org's deliveries with status
  - **Invoices:** Read-only table with invoice details
  - **Feedback:** Active feedback forms for client's deliveries, with "Submit Feedback" link to public form
