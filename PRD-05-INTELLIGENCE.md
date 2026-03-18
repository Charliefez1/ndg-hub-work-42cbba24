# PRD 05 — Intelligence: AI Assistant, Daily Brief & Insights

> **Priority:** Phase 5 — Build after Commercial (PRD-04) is complete.
> **Dependencies:** PRD-01 (foundation), PRD-02 (projects, tasks), PRD-03 (deliveries, forms)

---

## 1. AI Assistant (`/ai`)

### 1.1 Page Layout

Full-height chat interface within `<AppShell>`:
```
┌─ Header ──────────────────────────────────┐
│ "AI Assistant"   [X/20 calls]  [Agent ▾]  │
├───────────────────────────────────────────┤
│                                           │
│  Scrollable message area                  │
│  (flex-1 overflow-y-auto)                 │
│                                           │
├───────────────────────────────────────────┤
│ [Message input...................] [Send]  │
└───────────────────────────────────────────┘
```

Height calculation: `h-[calc(100vh-theme(spacing.12)-theme(spacing.lg)*2)]`

### 1.2 Agent System

4 agents, selectable via dropdown:

| Agent ID | Label | Description |
|----------|-------|-------------|
| `general` | General Assistant | Ask anything about your projects and data |
| `project-planner` | Project Planner | Help plan and scope new projects |
| `content-writer` | Content Writer | Draft workshop content and materials |
| `data-analyst` | Data Analyst | Analyse feedback and business metrics |

### 1.3 Rate Limiting
- 20 calls per hour
- Tracked client-side in localStorage
- Display remaining calls as badge: `{remaining} / 20 calls remaining`
- `getRemainingCalls()` function exported from `useAI.ts`

### 1.4 Chat Interface

**Empty state (no messages):**
- Large Bot icon (h-16 w-16)
- "How can I help?" heading
- Agent description text
- 3 suggestion pills (clickable, set as input):
  - "Summarise my active projects"
  - "Draft a workshop agenda"
  - "Analyse recent feedback scores"

**Message display:**
- User messages: right-aligned, primary background, white text, rounded card
- Assistant messages: left-aligned, surface background, with Bot avatar (primary/10 circle)
- Assistant content rendered via `<ReactMarkdown>` with prose styling
- Loading state: Bot avatar + card with spinning Loader2

**Input area:**
- Text input + Send button (icon)
- Enter to send (Shift+Enter for newline — via onKeyDown handler)
- Disabled while loading

### 1.5 Message Flow

```typescript
const sendMessage = async () => {
  // 1. Add user message to local state
  // 2. Clear input, set loading
  // 3. Call edge function:
  supabase.functions.invoke('ai-assistant', {
    body: { messages: allMessages, agent, userId }
  })
  // 4. Add assistant response to messages
  // 5. On error: show toast + add error message
}
```

### 1.6 Hooks Required

```typescript
// useAI.ts
getRemainingCalls()          // Check localStorage rate limit counter
useAIExtract()               // Calls ai-extract edge function (used in Projects)

// The AI chat itself uses direct supabase.functions.invoke, not a hook
```

---

## 2. Daily Brief (`/daily`)

### 2.1 Page Layout

```
┌─ Title: "Daily Brief" ──────────────────┐
│ Subtitle: "Wednesday, 18 March 2026"     │
│                                          │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐            │
│ │Due │ │Over│ │Done│ │Work│  ← KPIs     │
│ │Today│ │due │ │Today│ │shops│           │
│ └────┘ └────┘ └────┘ └────┘            │
│                                          │
│ ┌──────────┐  ┌──────────┬──────────┐   │
│ │  Daily    │  │ Focus    │ Upcoming │   │
│ │  Check-in │  │ Tasks    │ Workshops│   │
│ │  (1 col)  │  ├──────────┴──────────┤   │
│ │           │  │ Red Flags            │   │
│ │           │  │ Overdue Tasks        │   │
│ └──────────┘  └──────────────────────┘   │
└──────────────────────────────────────────┘
```

### 2.2 KPI Cards (4-column, responsive 2-col on mobile)

Each card has an icon + label + value:

| Card | Icon | Calculation |
|------|------|-------------|
| Due Today | Clock (primary) | Tasks where due_date === today AND status !== 'done' |
| Overdue | AlertTriangle (destructive) | Tasks where due_date < today AND status !== 'done' |
| Completed Today | CheckCircle2 (green) | Tasks where status === 'done' AND updated_at starts with today |
| Upcoming Workshops | CalendarCheck | Deliveries where delivery_date >= today, count |

### 2.3 Daily Check-in Widget

Left column card:

**Energy Slider:**
- Label: Battery icon + "Energy: X/10"
- `<Slider>` min=1 max=10 step=1

**Focus Slider:**
- Label: Brain icon + "Focus: X/10"
- `<Slider>` min=1 max=10 step=1

**Mood Selector:**
- Label: Smile icon + "Mood"
- 5 emoji buttons: 😤 😔 😐 😊 🤩
- Selected: `bg-primary/10 scale-125 ring-2 ring-primary`
- Hover: `scale-110`

**Notes:**
- `<Textarea>` placeholder "How are you feeling?" rows=2

**Submit Button:**
- Full width
- Label: "Check In" or "Update Check-in" (if already checked in today)
- Calls `upsertDailyState.mutate(...)` which upserts to `daily_states` table (unique on user_id + date)

### 2.4 Focus Tasks Card
- Lists tasks due today (not done)
- Each shows: title + priority badge

### 2.5 Upcoming Workshops Card
- Next 5 deliveries by date
- Each shows: title + date

### 2.6 Red Flags Card
- Only shown if `redFlags` array from `daily-brief` edge function is non-empty
- Card with `border-destructive/30`
- Each flag: AlertTriangle icon + label text
- Background: `bg-destructive/5` with `border-destructive/20`

### 2.7 Overdue Tasks Card
- Only shown if overdue tasks exist
- Card with `border-destructive/30`
- Lists task title + due date (in red)

### 2.8 Hooks Required

```typescript
// useDailyStates.ts
useTodayState(userId)           // SELECT from daily_states WHERE user_id = ? AND date = today
useUpsertDailyState()           // UPSERT to daily_states (unique on user_id + date)

// useDailyBrief.ts
useDailyBrief()                 // Calls daily-brief edge function
```

---

## 3. Insights (`/insights`)

### 3.1 Page Layout

Two tabs: **Business** and **Personal**

### 3.2 Business Tab

**Projects by Status (Pie Chart):**
- Groups projects by status, counts each
- Uses `PieChart` + `Pie` + `Cell` from Recharts
- Colour palette: `['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--secondary))', '#94a3b8', '#64748b']`
- Chart height: h-64

**Tasks by Status (Pie Chart):**
- Same approach, groups tasks by status

**Revenue by Month (Bar Chart, full width):**
- Filters invoices: status === 'paid' AND has paid_date
- Groups by month (YYYY-MM from paid_date)
- Shows last 6 months
- Uses `BarChart` + `Bar` with radius `[4, 4, 0, 0]`
- Fill: `hsl(var(--primary))`
- Includes CartesianGrid with strokeDasharray="3 3"

All charts wrapped in `<ResponsiveContainer width="100%" height="100%">`

### 3.3 Personal Tab

Data powered by `insights-personal` edge function.

**Optimal Work Window (top card):**
- Only shown if data available
- Card with `border-primary/30 bg-primary/5`
- Shows: 💡 + insight text

**Energy & Focus Over Time (Line Chart):**
- 30-day data from daily_states
- Two lines: energy (primary colour) and focus (accent colour)
- X-axis: dates (formatted MM-DD)
- Y-axis: 0-10 scale
- `strokeWidth={2} dot={false}`
- Empty state: "Log your daily energy to see trends."

**Focus by Day of Week (Bar Chart):**
- Two grouped bars per day: Avg Energy + Avg Focus
- Days: Mon-Sun
- Y-axis: 0-10

**Recovery: Delivery vs Non-Delivery Days (Stats Card):**
- Only shown when data available
- Two stat boxes side by side:
  - "Avg energy on delivery days (X days)"
  - "Avg energy on rest days (X days)"

### 3.4 Hooks Required

```typescript
// useInsights.ts
useInsightsPersonal()           // Calls insights-personal edge function
// Business data is computed client-side from existing hooks
```

---

## 4. Edge Functions Required

| Function | Purpose |
|----------|---------|
| `ai-assistant` | Multi-agent chat — receives messages array, agent type, userId. Returns { content: string } |
| `ai-extract` | Extracts structured project data from pasted proposal/email text |
| `ai-session-planner` | Generates session agenda items from workshop description |
| `ai-impact-reporter` | Generates impact reports from feedback data |
| `daily-brief` | Returns { redFlags: Array<{ label: string }> } — urgent items needing attention |
| `insights-business` | Aggregated business KPIs |
| `insights-personal` | Returns { energyOverTime, focusByDay, recovery, optimalWindow } |

---

## 5. AI Rate Limiting Implementation

```typescript
// In useAI.ts
const RATE_LIMIT_KEY = 'ndg-ai-calls';
const MAX_CALLS = 20;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getRemainingCalls(): number {
  const stored = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '[]');
  const now = Date.now();
  const recent = stored.filter((ts: number) => now - ts < WINDOW_MS);
  return MAX_CALLS - recent.length;
}

function recordCall() {
  const stored = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '[]');
  stored.push(Date.now());
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(stored));
}
```
