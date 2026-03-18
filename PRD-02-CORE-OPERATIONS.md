# PRD 02 — Core Operations: Dashboard, Projects, Tasks & Clients

> **Priority:** Phase 2 — Build after Foundation (PRD-01) is complete.
> **Dependencies:** PRD-01 (auth, layout, design system, schema)

---

## 1. Dashboard (`/`)

The home page shows a real-time operational summary.

### 1.1 Greeting
- Time-based: "Good morning/afternoon/evening" + display name from profile
- Subtitle: "Here's what's happening across your projects."

### 1.2 Quick Action Buttons
Row of outline buttons linking to: Projects, Tasks, Workshops, Invoices. Each has a lucide icon.

### 1.3 KPI Cards (4-column grid)
| Card | Calculation |
|------|-------------|
| Active Projects | Count of projects where status !== 'closed' |
| Pending Tasks | Count of tasks where status !== 'done' |
| Upcoming Workshops | Count of deliveries where delivery_date >= today |
| Revenue (Paid) | Sum of `total` for invoices with status === 'paid', formatted as £X,XXX |

### 1.4 Content Cards (2-column grid)

**Overdue Tasks** (only shown if count > 0):
- Card with `border-destructive/30`
- AlertTriangle icon in red
- Lists up to 5 overdue tasks (due_date < today AND status !== 'done')
- Shows task title and due date (date in red)

**Workshops This Week:**
- Lists upcoming deliveries (delivery_date >= today), max 3
- Each is a clickable link to `/workshops/:id`
- Shows title and date

**Recent Projects:**
- Lists latest 5 projects (by creation order)
- Each links to `/projects/:id`
- Shows name, org name, and status badge
- If no overdue tasks, this card spans full width (`col-span-2`)

### 1.5 Hooks Used
- `useProjects()`, `useDeliveries()`, `useTasks()`, `useInvoices()`

---

## 2. Projects (`/projects`)

### 2.1 List Page

**Header:** Title "Projects" + view toggle (Table/Board) + "New Project" button

**Table View:**
| Column | Content |
|--------|---------|
| Name | Link to `/projects/:id` in primary colour |
| Client | `organisations.name` via join |
| Status | Colour-coded badge using `getStatusBadgeClasses(status, 'project')` |
| Budget | `£X,XXX` or dash |
| Start | date or dash |
| End | date or dash |

**Board View (Kanban):**
- Horizontal scroll container with columns for each status
- Statuses: contracting, project_planning, session_planning, content_review, delivery, feedback_analytics, closed
- Each column: status badge header with count, then cards below
- Cards show: project name (bold), org name (caption)
- Cards link to `/projects/:id`

**Empty State:** FolderKanban icon + "No projects yet." + "New Project" button

### 2.2 Create Project Dialog

Two modes, switchable via tabs:

**Manual Mode:**
- Fields: Name (required), Client (select from organisations, required), Budget (number, optional)
- On submit: `createProject.mutateAsync({ name, organisation_id, budget })`

**Create from Plan Mode (AI):**
- Large textarea: "Paste your proposal, email, or plan"
- "Extract Plan" button calls `aiExtract.mutateAsync(planText)`
- Returns `ExtractedPlan`:
  ```typescript
  {
    projectName: string;
    organisationName?: string;
    intendedNeuroPhase?: string;
    budget?: number;
    startDate?: string;
    endDate?: string;
    notes?: string;
    deliveries: Array<{
      title: string;
      serviceType?: string;
      neuroPhase?: string;
      kirkpatrickLevel?: number;
      delegateCount?: number;
      durationMinutes?: number;
      deliveryDate?: string;
    }>;
  }
  ```
- **Preview screen** shows:
  - Project card with extracted name, client, budget, dates, NEURO phase
  - Deliveries list with title and metadata
  - Client selector (auto-matched from extracted name)
  - "Scaffold Project" button calls `scaffoldProject.mutateAsync(...)` which invokes the `scaffold-project` edge function
  - Edge function creates: project + deliveries + sessions + feedback forms

### 2.3 Project Detail (`/projects/:id`)

**Header:** Back arrow to `/projects`, project name, status badge, "Advance" button (shows next status in pipeline)

**Status Pipeline:** contracting → project_planning → session_planning → content_review → delivery → feedback_analytics → closed

**8 Tabs:**

| Tab | Content |
|-----|---------|
| **Overview** | 2-column grid: Client, Budget (£), Start Date, End Date, External Ref, Neuro Phase, Notes (full width) |
| **Workshops** | Filtered deliveries for this project. Each links to `/workshops/:id`. Shows title, status badge, date, service name |
| **Tasks** | Filtered tasks for this project. Shows title, due date, status badge |
| **Billing** | `<BillingTab>` component — invoice list + generate invoice action (selects uninvoiced deliveries → calls `generate-invoice` edge function) |
| **Forms** | `<FormsTab>` component — forms linked to this project |
| **Notes** | `<NotesTab>` component — per-user markdown notes |
| **Documents** | `<DocumentsTab>` component — file upload to Supabase storage + URL listing |
| **Updates** | `<UpdatesTab>` component — status update feed (manual + AI-generated) |

### 2.4 Hooks Required

```typescript
// useProjects.ts
useProjects()                    // SELECT * FROM projects (with org join)
useProject(id)                   // Single project by ID
useCreateProject()               // INSERT
useUpdateProject()               // UPDATE
useAdvanceProjectStatus()        // Calls advance-project-status edge function
useScaffoldProject()             // Calls scaffold-project edge function
```

---

## 3. Tasks (`/tasks`)

### 3.1 List Page

**Header:** Title "Tasks" + 5-view toggle + "New Task" button

**5 View Modes:**

#### Board View (Kanban)
- Columns: todo, in_progress, review, done, blocked
- Each column: status badge with count
- Cards: title, subtask indicator, priority badge, due date (red if overdue), project name
- 240px min-width columns, horizontal scroll

#### List View
- Sorted by priority (urgent→high→medium→low)
- Each row: checkbox (toggle done/todo), title (strikethrough if done), project name, due date, priority badge, status badge
- Checkbox: 5x5, rounded, border-2, green fill when done
- Overdue items have `border-destructive/30`

#### Table View
- Columns: Title, Project, Priority, Status (dropdown to change), Due, Actions (delete)
- Status column has inline `<Select>` for quick status changes
- Actions: dropdown with Delete option

#### Timeline View
- Tasks grouped by week (Monday start)
- Each week: dot + "Week of [date]" header
- Vertical timeline line connecting weeks
- Cards show title, status badge, date, priority
- "No Due Date" section at bottom for unscheduled tasks

#### Calendar View
- Monthly grid (Monday start)
- Navigation: Prev/Next month buttons
- Today highlighted with `ring-2 ring-primary`
- Tasks shown as coloured pills (green if done, primary if active)
- Max 3 visible per day + "+X more" indicator
- Click task pill to toggle done/todo

### 3.2 Create Task Dialog
- Fields: Title (required), Description (textarea), Project (select), Priority (select: low/medium/high/urgent, default medium), Due Date (date input)
- On submit: `createTask.mutateAsync({ title, description, project_id, priority, due_date })`

### 3.3 Hooks Required

```typescript
// useTasks.ts
useTasks(filters?)      // SELECT * FROM tasks (with project join), optional projectId filter
useCreateTask()         // INSERT
useUpdateTask()         // UPDATE (used for status changes)
useDeleteTask()         // DELETE
```

---

## 4. Clients (`/clients`, `/clients/:id`)

### 4.1 Client List

**Header:** Title "Clients" + "New Client" button

**Table:** Searchable list of organisations. Columns: Name (link), Sector, Status, Contact count.

**Create Dialog:** Fields: name (required), sector, email, phone, website, address

### 4.2 Client Detail (`/clients/:id`)

**Header:** Back arrow to `/clients`, org name, status badge (active/inactive)

**7 Tabs:**

| Tab | Content |
|-----|---------|
| **Profile** | 2-column grid: Sector, Email, Phone, Website, Address (full width), Notes (full width) |
| **Contacts** | Table with columns: Name (with primary star icon), Job Title, Email, Phone, Portal (invite button), Delete. Add Contact dialog with fields: name, email, phone, job title, is_primary checkbox. "Invite" button sends magic link via `supabase.auth.signInWithOtp()` |
| **Projects** | Filtered projects for this org. Each links to `/projects/:id`. Shows name, status badge, start date |
| **Contracts** | Filtered contracts for this org. Shows title, type, value, start date, status badge |
| **Invoices** | Filtered invoices for this org. Shows invoice number (monospace), project name, total, status badge |
| **Emails** | Filtered email threads for this org. Shows subject, from, date, snippet |
| **Activity** | Activity log entries from `activity_log` table, filtered by org. Shows action, entity type, timestamp. Limited to 20 most recent |

### 4.3 Portal Invite Flow
- Contact must have an email
- Clicking "Invite" sends a magic link OTP to the contact's email
- Link redirects to `/portal`
- User data includes `role: 'client'`
- Creates auth user automatically

### 4.4 Hooks Required

```typescript
// useOrganisations.ts
useOrganisations()              // SELECT * FROM organisations
useOrganisation(id)             // Single org
useCreateOrganisation()         // INSERT
useUpdateOrganisation()         // UPDATE
useContacts(organisationId)     // SELECT * FROM contacts WHERE organisation_id = ?
useCreateContact()              // INSERT contact
useDeleteContact()              // DELETE contact
```

---

## 5. Edge Functions Required

| Function | Purpose |
|----------|---------|
| `advance-project-status` | Validates and moves project to next status in pipeline |
| `scaffold-project` | Creates project + deliveries + sessions + feedback forms from AI-extracted plan |

---

## 6. Shared Component Patterns

All list pages follow this pattern:
1. Loading state: 3-4 `<Skeleton>` bars
2. Empty state: Large icon + message + CTA button
3. Data state: Table or card layout
4. All wrapped in `<AppShell>`
5. All use `toast.success()` / `toast.error()` for feedback
6. All badges use `getStatusBadgeClasses()` — never hardcode colours
