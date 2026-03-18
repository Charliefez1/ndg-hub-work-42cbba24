# PRD 07 — Support Entities: Partners, Knowledge Base & Meetings

> **Priority:** Phase 7 — Build after Engagement (PRD-06) is complete.
> **Dependencies:** PRD-01 (foundation), PRD-02 (projects, clients)

---

## 1. Partners (`/partners`)

### 1.1 Partner List
- CRUD table for delivery and referral partners
- "New Partner" button

**Table columns:** Name, Type, Email, Commission Rate (%)

### 1.2 Create Partner Dialog
Fields:
- Name (required)
- Type (select: referral, delivery, technology, content, other)
- Contact Email
- Commission Rate (number, percentage)
- Notes (textarea)

### 1.3 Hooks Required

```typescript
// usePartners.ts
usePartners()            // SELECT * FROM partners
useCreatePartner()       // INSERT
useUpdatePartner()       // UPDATE
useDeletePartner()       // DELETE
```

---

## 2. Knowledge Base (`/knowledge`)

### 2.1 Article List
- Grid layout of internal wiki articles
- "New Article" button
- Each card shows: title, category, tags (as small badges)
- Search by title, content, tags

### 2.2 Create Article Dialog
Fields:
- Title (required)
- Category (text)
- Tags (comma-separated text input → stored as text array)
- Content (large textarea, Markdown supported)

### 2.3 Article Display
- Markdown content rendered via `react-markdown`
- Full article view (could be inline expand or separate detail page)

### 2.4 Hooks Required

```typescript
// useKnowledgeArticles.ts
useKnowledgeArticles()           // SELECT * FROM knowledge_articles
useCreateKnowledgeArticle()      // INSERT
useUpdateKnowledgeArticle()      // UPDATE
useDeleteKnowledgeArticle()      // DELETE
```

---

## 3. Meetings (`/meetings`)

### 3.1 Meeting List
- CRUD table for scheduled meetings
- "New Meeting" button

**Table columns:** Title, Type, Date/Time, Duration, Location, Client

### 3.2 Create Meeting Dialog
Fields:
- Title (required)
- Type (select: discovery, check-in, review, planning, workshop, other)
- Scheduled Date/Time (datetime-local input)
- Duration (minutes, number)
- Location (text)
- Client (select from organisations, optional)
- Project (select, optional)
- Contact (select from contacts of selected org, optional)
- Notes (textarea)
- Attendees (text/JSON, optional)

### 3.3 Future Integration
- `gcal_event_id` field exists for future Google Calendar sync
- Currently meetings are manually created, not synced

### 3.4 Hooks Required

```typescript
// useMeetings.ts
useMeetings()            // SELECT * FROM meetings (with org join)
useCreateMeeting()       // INSERT
useUpdateMeeting()       // UPDATE
useDeleteMeeting()       // DELETE
```

---

## 4. Project Sub-Components

These components are used within Project Detail tabs (PRD-02) but are worth specifying here:

### 4.1 Documents Tab (`src/components/projects/DocumentsTab.tsx`)
- Lists documents linked to a project
- Upload button: uploads file to Supabase Storage `documents` bucket
- Shows: file name, type, upload date, download link
- Also supports URL-based document linking
- Reused in Workshop Detail too

### 4.2 Notes Tab (`src/components/projects/NotesTab.tsx`)
- Per-user notes for a project
- Markdown content editor
- Auto-saves on blur or explicit save
- Each user sees only their own notes

### 4.3 Updates Tab (`src/components/projects/UpdatesTab.tsx`)
- Status update feed for a project
- Manual updates: text input + submit
- AI-generated updates (from status changes)
- Shows: content, update type, timestamp
- Ordered newest first

### 4.4 Forms Tab (`src/components/projects/FormsTab.tsx`)
- Lists forms linked to this project
- Shows form title, type, active status
- Links to form detail page

---

## 5. Shared CRUD Page Pattern

All three entities (Partners, Knowledge Base, Meetings) follow the same pattern:

```
Page Layout:
├── AppShell wrapper
├── Header: Title + "New X" button
├── Loading: Skeleton bars
├── Empty: Icon + message + CTA
└── Data: Table or grid of items
     └── Each row: data columns + actions dropdown (edit/delete)

Create/Edit Dialog:
├── DialogContent with DialogHeader
├── Form with fields
├── Cancel + Submit buttons
└── Toast on success/error
```

**Standard behaviours:**
- All mutations use React Query `mutateAsync`
- Success: `toast.success('X created/updated/deleted')`
- Error: `toast.error(err.message)`
- Dialogs reset form state on close
- All tables use shadcn/ui `<Table>` components

---

## 6. Edge Functions (none new)

These entities don't require edge functions — all operations are direct Supabase CRUD.

---

## 7. Summary of All Hook Files

For reference, here is the complete list of hook files needed across the entire app:

| File | Entities |
|------|----------|
| `useAuth.tsx` | Auth context, session, profile, roles |
| `useProjects.ts` | Projects, scaffold, advance status |
| `useTasks.ts` | Tasks CRUD |
| `useOrganisations.ts` | Organisations, contacts |
| `useDeliveries.ts` | Deliveries, sessions, agenda items |
| `useServices.ts` | Services CRUD |
| `useInvoices.ts` | Invoices + edge functions |
| `useContracts.ts` | Contracts CRUD |
| `useForms.ts` | Forms, responses, submission |
| `useAI.ts` | AI extract, rate limiting |
| `useDailyBrief.ts` | Daily brief edge function |
| `useDailyStates.ts` | Daily check-in upsert |
| `useInsights.ts` | Personal insights edge function |
| `useNotifications.ts` | Notifications CRUD |
| `useEmails.ts` | Emails (read-only) |
| `usePartners.ts` | Partners CRUD |
| `useKnowledgeArticles.ts` | Knowledge articles CRUD |
| `useMeetings.ts` | Meetings CRUD |
| `useCurriculumWorkshops.ts` | Curriculum templates CRUD |
| `useDocuments.ts` | Document uploads |
| `use-mobile.tsx` | Mobile viewport detection |
| `use-toast.ts` | Toast notification hook |

---

## 8. Edge Functions — Complete List (15)

| Function | Trigger | Purpose |
|----------|---------|---------|
| `advance-project-status` | Manual | Move project through status pipeline |
| `advance-delivery-status` | Manual | Move delivery through status pipeline |
| `scaffold-project` | Manual | Auto-create deliveries + sessions + forms from plan |
| `generate-invoice` | Manual | Create invoice from project deliveries |
| `recalculate-invoice` | Manual | Recompute invoice totals |
| `mark-invoice-paid` | Manual | Set invoice status + paid_date |
| `send-invoice` | Manual | Email invoice to client |
| `ai-assistant` | Manual | Multi-agent chat |
| `ai-extract` | Manual | Extract structured data from text via LLM |
| `ai-session-planner` | Manual | Generate session agendas via LLM |
| `ai-impact-reporter` | Manual | Generate impact reports from feedback |
| `daily-brief` | Manual | Generate daily summary with red flags |
| `insights-business` | Manual | Aggregate business KPIs |
| `insights-personal` | Manual | Personal energy/focus analytics |
| `process-form-response` | Manual | Post-processing on form submissions |
