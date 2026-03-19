

## Plan: Task Management Power-Up

This is a large feature set. I'll break it into phases that build on each other, implementing all requested capabilities.

---

### Phase 1 — Database Schema Changes (Migration)

Add new columns and tables:

```sql
-- Task enhancements
ALTER TABLE tasks ADD COLUMN recurrence text; -- daily, weekly, monthly, custom
ALTER TABLE tasks ADD COLUMN recurrence_rule jsonb; -- {interval, days_of_week, etc}
ALTER TABLE tasks ADD COLUMN is_template boolean DEFAULT false;
ALTER TABLE tasks ADD COLUMN template_id uuid REFERENCES tasks(id);
ALTER TABLE tasks ADD COLUMN completed_at timestamptz;

-- Custom fields system
CREATE TABLE task_custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  field_type text NOT NULL, -- text, number, date, select, checkbox
  options jsonb, -- for select fields
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE task_custom_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  field_id uuid REFERENCES task_custom_fields(id) ON DELETE CASCADE NOT NULL,
  value jsonb,
  UNIQUE(task_id, field_id)
);

-- Task comments
CREATE TABLE task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Focus sessions (Pomodoro)
CREATE TABLE focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_minutes integer NOT NULL DEFAULT 25,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Automation rules
CREATE TABLE automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL, -- task_overdue, status_change, daily_schedule, workload_threshold
  trigger_config jsonb NOT NULL DEFAULT '{}',
  action_type text NOT NULL, -- notify, reassign, change_status, create_task, ai_summary
  action_config jsonb NOT NULL DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

RLS policies on all new tables for admin/team access. Enable realtime on `task_comments`.

### Phase 2 — Subtasks UI

- Update `useTasks` hook to fetch subtasks (`parent_task_id` relationships)
- In BoardView/ListView: show subtask count badge, expandable subtask list
- In CreateTaskDialog: add optional "Parent Task" selector
- Add inline "Add subtask" button on task cards

### Phase 3 — Drag-and-Drop Board

- Add `@hello-pangea/dnd` (React DnD library, maintained fork of react-beautiful-dnd)
- Wrap BoardView columns in `<Droppable>`, cards in `<Draggable>`
- On drop: call `updateTask` with new status
- Visual feedback during drag

### Phase 4 — Task Comments

- New `useTaskComments` hook (CRUD on `task_comments`)
- Task detail sheet/dialog with comment thread
- Click any task card to open detail view with comments, subtasks, custom fields
- Show user avatars from profiles table

### Phase 5 — Focus Mode

- New `FocusMode` component: fullscreen overlay with timer, current task, break prompts
- Pomodoro timer (25min work / 5min break, configurable)
- Tracks sessions in `focus_sessions` table
- Accessible from task cards ("Focus on this") and toolbar
- ADHD-friendly: minimal UI, progress ring, ambient sound toggle

### Phase 6 — Recurring Tasks

- New edge function `process-recurring-tasks` triggered by pg_cron daily
- Scans tasks with `recurrence` set and `status = done` + `completed_at` in last cycle
- Creates new task instance, links via `template_id`
- UI: recurrence picker in CreateTaskDialog (daily/weekly/monthly/custom)

### Phase 7 — AI Proactive Daily Message

- New edge function `ai-daily-coach` that:
  - Pulls today's tasks, overdue items, energy levels, workload distribution
  - Sends to Lovable AI Gateway with a coaching prompt
  - Returns personalized summary with priorities, warnings, and suggestions
- Add AI summary card to DailyBrief page (call on page load, cache for the day)
- Proactive nudges: "You have 3 overdue tasks — want me to help reprioritize?"

### Phase 8 — Workload View

- New view option in Tasks page: `workload`
- Horizontal bar chart per team member showing task count by status
- Uses assignee field + profiles table for names
- Highlights overloaded members (configurable threshold)

### Phase 9 — Custom Fields

- Settings UI to create/manage custom fields for tasks
- Dynamic form rendering in task create/edit dialog
- Values stored in `task_custom_field_values`
- Display in table view as extra columns

### Phase 10 — Task Templates

- Mark tasks as `is_template = true` via UI toggle
- "Create from Template" button that clones a template task (with subtasks, custom field values)
- Template library in a dedicated section

### Phase 11 — Proactive Automations & Workflows

Pre-built automation rules seeded into the system:

1. **Overdue Alert** — When a task passes its due date without completion, notify the assignee and flag in daily brief
2. **Stale Task Nudge** — Tasks in `in_progress` for >3 days without update get a "still working on this?" notification
3. **Auto-Complete Subtasks** — When all subtasks are done, suggest marking parent as done
4. **Workload Balancer Alert** — If any team member has >10 active tasks, notify admin
5. **Weekly Review Prep** — Every Friday, AI generates a week summary of completed/blocked tasks
6. **Post-Workshop Follow-up** — After a delivery is marked complete, auto-create follow-up tasks (send feedback form, upload materials)
7. **Invoice Reminder** — Unpaid invoices past due date trigger daily notifications

New edge function `process-automations` runs via pg_cron every hour, evaluates active rules, and creates notifications/tasks as needed.

### Phase 12 — AI Workload Coach (Clarify-style)

- Enhance the AI assistant with a `workload-coach` agent
- Proactively analyzes: task distribution, overdue patterns, energy/focus trends
- Suggests: task reassignment, priority changes, deadline adjustments
- Accessible via Daily Brief ("AI suggests...") and AI Assistant page
- Example outputs: "You've been low energy 3 days in a row — consider moving 2 tasks to next week" or "Project X has 8 tasks due this week but only 2 team members assigned"

---

### Implementation Order

Steps 1-5 first (schema + subtasks + drag-drop + comments + focus mode) as they're the highest-impact, most visible changes. Then 6-7 (recurring + AI daily). Then 8-12 (workload, custom fields, templates, automations, AI coach).

### Technical Details

- **Drag-and-drop**: `@hello-pangea/dnd` — lightweight, accessible, React 18 compatible
- **Focus timer**: Pure React with `useEffect` interval, no external deps
- **Recurring tasks cron**: pg_cron + pg_net calling the edge function daily at 6am
- **AI calls**: All via existing Lovable AI Gateway, no new API keys needed
- **Custom fields**: JSONB storage for flexibility, rendered dynamically in forms

