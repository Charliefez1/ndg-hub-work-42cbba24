# PRD 03 — Delivery: Workshops, Sessions, Curriculum & Forms

> **Priority:** Phase 3 — Build after Core Operations (PRD-02) is complete.
> **Dependencies:** PRD-01 (foundation), PRD-02 (projects, clients)

---

## 1. Workshops (`/workshops`)

### 1.1 Workshop List

**Header:** Title "Workshops" + view toggle (Table/Board) + "New Workshop" button

**Table View:**
| Column | Content |
|--------|---------|
| Title | Link to `/workshops/:id` |
| Client | `organisations.name` via join |
| Service | `services.name` via join |
| Date | `delivery_date` or dash |
| Status | Badge via `getStatusBadgeClasses(status, 'delivery')` |

**Board View (Kanban):**
- Columns for each delivery status: planning, scheduled, in_progress, delivered, follow_up, complete, cancelled
- Cards show: title (bold), org name + date (caption)
- Cards link to `/workshops/:id`

**Empty State:** Briefcase icon + "No workshops yet." + CTA button

### 1.2 Create Workshop Dialog
- Fields:
  - Title (required)
  - Project (required, select from projects)
  - Service (optional, select from services)
  - Delivery Date (optional, date input)
- On submit: `createDelivery.mutateAsync({ title, project_id, organisation_id: selectedProject.organisation_id, service_id, delivery_date })`
- `organisation_id` is derived from the selected project

### 1.3 Hooks Required

```typescript
// useDeliveries.ts
useDeliveries(projectId?)       // SELECT * FROM deliveries (with org, project, service joins)
useDelivery(id)                 // Single delivery by ID
useCreateDelivery()             // INSERT
useUpdateDelivery()             // UPDATE
useAdvanceDeliveryStatus()      // Calls advance-delivery-status edge function
```

---

## 2. Workshop Detail (`/workshops/:id`)

### 2.1 Header
- Back arrow to `/workshops`
- Workshop title
- Status badge (delivery status)
- NEURO phase badge (if set)
- Kirkpatrick level badge "L{n}" (if set)
- Advance buttons — only show valid next statuses:
  ```
  planning → [scheduled]
  scheduled → [in_progress]
  in_progress → [delivered]
  delivered → [follow_up, complete]
  follow_up → [complete]
  ```

### 2.2 Overview Tab
2-column grid showing:
- Client (org name)
- Project (link to `/projects/:id`)
- Service (service name)
- Date
- Duration (Xm format)
- Delegates (count)
- Location
- Satisfaction (X/10 or dash)

### 2.3 Sessions Tab

**Add Session button** at top right.

Session list — each session is an expandable card:
- **Collapsed:** Title, session_type + duration (caption), content_status badge
- **Expanded (click to toggle):** Shows the **Agenda Builder**

#### Agenda Builder

Shows within expanded session. Features:

**Header:** Clock icon + "X / Y minutes planned" (red if over target) + "Add Block" button

**Agenda Items List:**
Each item row:
- Reorder controls (up/down chevrons)
- Type badge with colour coding:
  - `intro` → green (`bg-success/15 text-success`)
  - `activity` → blue (`bg-info/15 text-info`)
  - `break` → amber (`bg-warning/15 text-warning`)
  - `debrief` → purple (`bg-purple/15 text-purple`)
  - `energiser` → pink (`bg-pink/15 text-pink`)
- Title
- Method (caption, right-aligned)
- Duration in monospace (Xm)
- Delete button (Trash2 icon, destructive)

**Reordering:** Clicking up/down swaps `position` values between adjacent items

**Add Block Inline Form:**
- Type select (intro/activity/break/debrief/energiser)
- Title input
- Method input
- Duration input (number, minutes)
- Add button + Cancel button
- All in a single row (flex wrap)

### 2.4 Feedback Tab

**If no feedback form linked:** "No feedback form linked to this workshop."

**If form exists:**
- 2-column KPI cards:
  - Satisfaction Score (X/10)
  - Response count
- Public form link display (code block with full URL)
- Response cards — each shows:
  - Timestamp
  - Key-value pairs from response data (JSON parsed)

### 2.5 Documents Tab
Reuses `<DocumentsTab projectId={delivery.project_id} />` component.

### 2.6 Add Session Dialog
- Fields: Title (required), Duration in mins (number, default 90)
- Creates session linked to delivery and project

### 2.7 Hooks Required

```typescript
// useDeliveries.ts (additional exports)
useSessions(deliveryId)          // SELECT * FROM sessions WHERE delivery_id = ?
useCreateSession()               // INSERT session
useAgendaItems(sessionId)        // SELECT * FROM session_agenda_items WHERE session_id = ? ORDER BY position
useCreateAgendaItem()            // INSERT agenda item
useUpdateAgendaItem()            // UPDATE (for reordering)
useDeleteAgendaItem()            // DELETE
```

---

## 3. Forms (`/forms`, `/forms/:id`)

### 3.1 Form List (`/forms`)
- Table listing all forms
- Columns: Title, Type, Project, Active toggle
- Types: feedback, intake, assessment, survey, registration
- Create form dialog with:
  - Title
  - Type selector
  - Project selector (optional)
  - Delivery selector (optional)
  - Kirkpatrick level (optional)
- Default fields auto-generated on creation (satisfaction rating + open questions)

### 3.2 Form Detail (`/forms/:id`)

**Two tabs:**

**Fields Tab:**
- JSON-based dynamic field editor
- Field types: text, number, rating, select, multi-select, textarea, nps
- Each field: label, type, required toggle, options (for select types)
- Active/inactive toggle for the form

**Responses Tab:**
- List of submitted responses
- Each shows timestamp + key-value data
- Public link display

### 3.3 Public Form (`/form/:formId`)

**Unauthenticated route** — anyone can access.

- Fetches form definition by ID
- Only renders if form is active
- Dynamically renders fields from JSON definition:
  - Text → `<Input>`
  - Textarea → `<Textarea>`
  - Rating → slider or star selector
  - Number → `<Input type="number">`
  - Select → `<Select>`
- Submit button calls `process-form-response` edge function
- Success screen: "Thank you!" message

### 3.4 Hooks Required

```typescript
// useForms.ts
useForms()                       // SELECT * FROM forms
useForm(id)                      // Single form
useCreateForm()                  // INSERT
useUpdateForm()                  // UPDATE
useFormResponses(formId)         // SELECT * FROM form_responses WHERE form_id = ?
useSubmitFormResponse()          // Calls process-form-response edge function
```

---

## 4. Curriculum Templates (`/curriculum`)

### 4.1 Template List
- Grid of curriculum workshop templates
- Each shows: title, service name, NEURO phase badge
- Create dialog: title, service (select), neuro phase (select)
- Delete functionality

### 4.2 Data Structure
Curriculum templates store reusable workshop blueprints:
- `default_agenda` (JSONB): Pre-built agenda items
- `materials` (JSONB): Material references
- `partner_variants` (JSONB): Variations for different delivery partners

### 4.3 Hooks Required

```typescript
// useCurriculumWorkshops.ts
useCurriculumWorkshops()         // SELECT * FROM curriculum_workshops (with service join)
useCreateCurriculumWorkshop()    // INSERT
useDeleteCurriculumWorkshop()    // DELETE
```

---

## 5. Edge Functions Required

| Function | Purpose |
|----------|---------|
| `advance-delivery-status` | Validates and moves delivery through status pipeline |
| `ai-session-planner` | Generate session agenda items from workshop description via AI |
| `process-form-response` | Post-processing on form submissions (calculates satisfaction scores, etc.) |

---

## 6. NEURO Framework Integration

Deliveries and sessions are tagged with NEURO phases:
- `needs` — Needs assessment and discovery
- `engage` — Stakeholder engagement
- `understand` — Deep learning
- `realise` — Applying learning
- `ongoing` — Sustained change

Kirkpatrick evaluation levels (1-4) tag forms and deliveries:
- Level 1: Reaction
- Level 2: Learning
- Level 3: Behaviour
- Level 4: Results
