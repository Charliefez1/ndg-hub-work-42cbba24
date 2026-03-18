# PRD 06 — Engagement: Client Portal, Emails, Notifications & Settings

> **Priority:** Phase 6 — Build after Intelligence (PRD-05) is complete.
> **Dependencies:** PRD-01 (auth, RLS), PRD-02 (projects, clients), PRD-03 (deliveries, forms)

---

## 1. Client Portal (`/portal`)

### 1.1 Overview

A separate, simplified interface for client users. No sidebar — standalone layout.

**Access control:**
- Only users with `client` role can access
- Data scoped via `client_portal_access` table (links user to org)
- Read-only access + feedback form submission
- Route: `<RouteGuard allowedRoles={['client']}>`

### 1.2 Layout

**Header (not AppShell):**
```html
<header class="h-14 border-b bg-surface px-6 flex items-center justify-between sticky top-0 z-30">
  <span class="font-satoshi text-lg font-bold">NDG Hub — Client Portal</span>
  <div>
    <span>{displayName}</span>
    <button>Sign Out</button>
  </div>
</header>
```

**Main content:** `max-w-5xl mx-auto p-lg`

### 1.3 Welcome Message
- "Welcome, {displayName}"
- If no portal access configured: "No portal access configured yet. Please contact your account manager."

### 1.4 Tabs (4)

**Projects Tab:**
- Lists projects for client's org(s)
- Each card shows: name, date range, status badge
- Read-only — no edit actions

**Workshops Tab:**
- Lists deliveries for client's org(s)
- Each card shows: title, date + location, status badge
- Read-only

**Invoices Tab:**
- Table with columns: Invoice # (monospace), Project, Total (£), Status (badge), Due date
- Read-only

**Feedback Tab:**
- Only shown if `permissions.can_submit_forms !== false`
- Lists active feedback forms linked to client's deliveries
- Each shows: form title, workshop title + date, description
- "Submit Feedback" button links to `/form/{formId}` (public form)

### 1.5 Data Fetching

All queries scoped by `orgIds` from `client_portal_access`:

```typescript
// Fetch access records for current user
const { data: access } = useQuery(['portal-access', userId], () =>
  supabase.from('client_portal_access')
    .select('*, organisations(name)')
    .eq('user_id', userId)
);

const orgIds = access.map(a => a.organisation_id);

// Then fetch projects, deliveries, invoices filtered by orgIds
supabase.from('projects').select('*').in('organisation_id', orgIds)
supabase.from('deliveries').select('*').in('organisation_id', orgIds)
supabase.from('invoices').select('*, projects(name)').in('organisation_id', orgIds)

// Feedback forms: filter by delivery IDs belonging to the org
supabase.from('forms')
  .select('*, deliveries(title, delivery_date)')
  .eq('type', 'feedback')
  .eq('active', true)
  .in('delivery_id', deliveryIds)
```

---

## 2. Emails (`/emails`)

### 2.1 Email List
- Read-only viewer for tracked email threads (Gmail integration placeholder)
- Search bar: filters by subject, from, snippet
- Each email card shows:
  - Subject (bold, truncated)
  - Date (right-aligned, day + month format)
  - From address (caption)
  - Snippet (text-xs, line-clamp-2)
- Grouped by `thread_id` (threads that share a thread_id appear together)

### 2.2 Hooks Required

```typescript
// useEmails.ts
useEmails()              // SELECT * FROM emails ORDER BY received_at DESC
```

### 2.3 Notes
- This is a read-only display. Emails are populated externally (future Gmail sync).
- Table has fields for future integration: `gmail_id`, `thread_id`, `organisation_id`, `project_id`

---

## 3. Notifications

### 3.1 NotificationBell Component (`src/components/notifications/NotificationBell.tsx`)

Located in the AppShell header.

**Features:**
- Bell icon from lucide-react
- Unread count badge (red dot with number)
- Click opens a popover dropdown
- Lists notifications: title, message, timestamp, type icon
- Types: info, warning, success, error (each with appropriate colour)
- "Mark as read" per notification
- "Mark all as read" button
- Notifications stored in `notifications` table

### 3.2 Hooks Required

```typescript
// useNotifications.ts
useNotifications()              // SELECT * FROM notifications WHERE user_id = auth.uid() ORDER BY created_at DESC
useMarkNotificationRead()       // UPDATE read = true
useMarkAllNotificationsRead()   // UPDATE all unread to read
```

---

## 4. Settings (`/settings`)

### 4.1 Page Structure

Three tabs: Profile, Appearance, Notifications

### 4.2 Profile Tab

Card with fields:
- **Email** — disabled input, shows `user.email`
- **Display Name** — editable input
- **Role** — disabled input, shows `profile.role`
- **Telegram Chat ID** — editable input, placeholder "For push notifications"
  - Caption: "Used for Telegram push notifications."
- **Save Profile** button — updates `profiles` table

### 4.3 Appearance Tab

**Theme Card:**
- 3 buttons (toggle group): Light (Sun icon), Dark (Moon icon), System (Monitor icon)
- Active button uses `variant="default"`, others `variant="outline"`
- Calls `setTheme()` from `src/lib/theme.ts`

**Accent Colour Card:**
- 5 circular colour swatches (w-10 h-10 rounded-full)
- Colours: Steel (#4A7CBA), Sky (#0EA5E9), Mint (#10B981), Amber (#F59E0B), Purple (#8B5CF6)
- Selected: border matches colour + box-shadow glow + Check icon overlay (white)
- Calls `setAccent()` from `src/lib/theme.ts`

### 4.4 Notifications Tab

Card with toggle rows:
| Notification | In-app Toggle | Telegram Toggle |
|-------------|---------------|-----------------|
| Task assigned to me | ✓ (default on) | ○ (default off) |
| Workshop delivery reminders | ✓ | ○ |
| Invoice overdue alerts | ✓ | ○ |
| New feedback form responses | ✓ | ○ |
| Project status changes | ✓ | ○ |

Footer note: "Telegram notifications require a Telegram Chat ID in your profile settings."

Each row uses `<Switch>` toggles. These are currently placeholder — toggles don't persist to backend.

---

## 5. Portal Access Management

### How clients get access:

1. Admin creates an Organisation with contacts (in Clients section)
2. Admin clicks "Invite" on a contact → sends magic link OTP email
3. Contact clicks link → creates auth account with `client` role
4. Admin creates a `client_portal_access` row linking the user to their organisation
5. Client signs in → RouteGuard redirects to `/portal`
6. Portal queries `client_portal_access` to determine which orgs they can see

### Permissions (JSONB):
```json
{
  "can_submit_forms": true
}
```

---

## 6. Key Design Decisions

1. **Portal is completely separate from the main app** — different layout, no sidebar, no AppShell
2. **Portal data is read-only** except for feedback form submission (which uses the public form route)
3. **Emails are read-only** — the table is a display layer for externally synced data
4. **Notification preferences are placeholder** — UI exists but doesn't persist yet
5. **Theme and accent changes are instant** — stored in localStorage, no server round-trip
