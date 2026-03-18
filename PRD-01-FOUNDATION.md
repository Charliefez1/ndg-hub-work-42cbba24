# PRD 01 — Foundation: Auth, Layout, Design System & Database Schema

> **Priority:** Phase 1 — Build this first. Everything else depends on it.

---

## 1. Overview

Set up the foundational layer of NDG Hub: authentication, role-based access, the app shell layout, the design system (typography, theming, colour tokens), and the complete Supabase database schema with Row-Level Security.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | ^18.3 |
| Build tool | Vite | ^8.0 |
| Language | TypeScript | ^5.8 |
| Styling | Tailwind CSS | ^3.4 |
| Components | shadcn/ui (Radix primitives) | Latest |
| Routing | React Router DOM | ^6.30 |
| State/Data | TanStack React Query | ^5.83 |
| Forms | React Hook Form + Zod | ^7.61 / ^3.25 |
| Charts | Recharts | ^2.15 |
| Markdown | react-markdown | ^10.1 |
| Toast | Sonner | ^1.7 |
| Dates | date-fns | ^3.6 |
| Icons | lucide-react | Latest |

---

## 3. Design System

### 3.1 Typography
- **Headings:** Satoshi 700 (import from Fontshare)
- **Body:** General Sans 400/500/600 (import from Fontshare)
- **Monospace:** JetBrains Mono 400/500 (import from Google Fonts)

Font imports:
```css
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@500;700&f[]=general-sans@400;500;600&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
```

### 3.2 Utility Classes (define in index.css)
```css
.text-page-title    → font-family: Satoshi; text-[28px] font-bold tracking-tight
.text-section-title → font-family: Satoshi; text-base font-medium
.text-body-medium   → text-sm font-medium
.text-label         → text-xs font-medium
.text-caption       → text-xs text-muted-foreground
.text-overline      → text-[11px] font-medium uppercase tracking-widest
```

### 3.3 Colour Tokens (CSS custom properties in HSL)

**Light mode (`:root`):**
```
--background: 0 0% 94.5%
--foreground: 0 0% 10%
--card: 0 0% 100%
--popover: 0 0% 100%
--secondary: 0 0% 96%
--muted: 40 6% 90%
--muted-foreground: 0 0% 35%
--border: 40 6% 86%
--destructive: 0 84% 60%
--success: 142 76% 36%
--warning: 38 92% 50%
--info: 201 96% 39%
```

**Dark mode (`.dark`):**
```
--background: 0 0% 20%
--foreground: 0 0% 100%
--card: 0 0% 25%
--border: 0 0% 44%
```

**Primary colour references accent:**
```
--primary: var(--accent)
--primary-foreground: var(--accent-foreground)
--primary-hover: var(--accent-hover)
```

### 3.4 Accent Colour System (5 options)

Each accent defines `--accent`, `--accent-foreground`, `--accent-muted`, `--accent-hover` for both light and dark:

| Accent | Hue | Default? |
|--------|-----|----------|
| `steel` | 200 49% 58% | YES |
| `sky` | 200 65% 79% | |
| `mint` | 148 47% 68% | |
| `amber` | 40 90% 44% | |
| `purple` | 245 82% 71% | |

Applied via `[data-accent="steel"]` attribute on `<html>`.

### 3.5 Theme System (`src/lib/theme.ts`)

```typescript
type Theme = 'light' | 'dark' | 'system';
type Accent = 'steel' | 'sky' | 'mint' | 'amber' | 'purple';
```

- Store in localStorage keys `ndg-theme` and `ndg-accent`
- `initTheme()` — called on app mount, reads storage, applies class + attribute
- `setTheme(theme)` — toggles `.dark` class on `<html>`
- `setAccent(accent)` — sets `data-accent` attribute on `<html>`
- System theme listens to `prefers-color-scheme` media query
- Theme transitions: add `data-transitioning` attribute during switch, remove after 250ms

### 3.6 Spacing & Radius Tokens
```
--radius: 0.5rem
--radius-sm: 6px   --radius-md: 8px   --radius-lg: 14px   --radius-xl: 16px
--shadow-sm/md/lg (defined in CSS)
--duration-fast: 100ms   --duration-normal: 200ms   --duration-slow: 300ms
```

### 3.7 Status Badge System (`src/lib/status-colors.ts`)

Centralised colour mapping for all status badges. Never hardcode badge colours in components.

**Entities and their status → colour mappings:**

| Entity | Status → Colour |
|--------|----------------|
| `project` | contracting→warning, project_planning→info, session_planning→cyan, content_review→purple, delivery→success, feedback_analytics→pink, closed→text-3 |
| `delivery` | planning→text-2, scheduled→warning, in_progress→info, delivered→purple, follow_up→cyan, complete→success, cancelled→destructive |
| `invoice` | draft→text-3, sent→info, viewed→purple, paid→success, overdue→destructive |
| `task` | todo→text-3, in_progress→info, blocked→destructive, review→purple, done→success |
| `contract` | draft→text-3, sent→info, signed→success, expired→warning, cancelled→destructive |
| `neuro_phase` | needs→warning, engage→info, understand→purple, realise→success, ongoing→cyan |

**Functions to export:**
- `getStatusColor(status, entity)` → returns colour token string
- `getStatusBadgeClasses(status, entity)` → returns Tailwind classes like `bg-success/15 text-success`
- `formatStatus(status)` → replaces `_` with space and title-cases

---

## 4. Authentication

### 4.1 Supabase Auth Setup
- Method: Email + password (Supabase Auth)
- Auto-confirm: Enabled (no email verification)
- Roles: Enum `app_role` = `admin | team | client`
- Default role for new signups: `team`

### 4.2 Auth Context (`src/hooks/useAuth.tsx`)

Create an `AuthProvider` wrapping the entire app. Exposes:

```typescript
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: { id, display_name, avatar_url, role } | null;
  roles: AppRole[];
  loading: boolean;
  signIn(email, password): Promise<{ error }>;
  signUp(email, password, displayName?): Promise<{ error }>;
  signOut(): Promise<void>;
  hasRole(role): boolean;
  isAdminOrTeam: boolean;
}
```

**Implementation details:**
- On auth state change, fetch `profiles` and `user_roles` in parallel
- Use `setTimeout(() => fetchProfile(), 0)` to avoid Supabase deadlock on auth callback
- signUp passes `display_name` in `options.data`

### 4.3 Route Guard (`src/components/auth/RouteGuard.tsx`)

```tsx
<RouteGuard allowedRoles={['admin', 'team']}>{children}</RouteGuard>
```

- If loading → show centered `<Loader2>` spinner
- If no session → `<Navigate to="/login">`
- If wrong role → client users redirect to `/portal`, admin/team redirect to `/`

### 4.4 Login Page (`/login`)
- Two-tab form: Sign In / Sign Up
- Email + password fields
- On success: auto-redirects (auth state change triggers route guard)
- Loading spinner during auth resolution

### 4.5 Route Structure

```tsx
// Public
<Route path="/login" element={<Login />} />
<Route path="/form/:formId" element={<PublicForm />} />

// Admin/Team (wrapped in Guard)
<Route path="/" element={<Guard><Home /></Guard>} />
<Route path="/services" element={<Guard><Services /></Guard>} />
<Route path="/clients" element={<Guard><Clients /></Guard>} />
<Route path="/clients/:id" element={<Guard><ClientDetail /></Guard>} />
<Route path="/projects" element={<Guard><Projects /></Guard>} />
<Route path="/projects/:id" element={<Guard><ProjectDetail /></Guard>} />
<Route path="/workshops" element={<Guard><Workshops /></Guard>} />
<Route path="/workshops/:id" element={<Guard><WorkshopDetail /></Guard>} />
<Route path="/tasks" element={<Guard><Tasks /></Guard>} />
<Route path="/forms" element={<Guard><Forms /></Guard>} />
<Route path="/forms/:id" element={<Guard><FormDetail /></Guard>} />
<Route path="/invoices" element={<Guard><Invoices /></Guard>} />
<Route path="/daily" element={<Guard><DailyBrief /></Guard>} />
<Route path="/insights" element={<Guard><Insights /></Guard>} />
<Route path="/ai" element={<Guard><AIAssistant /></Guard>} />
<Route path="/settings" element={<Guard><Settings /></Guard>} />
<Route path="/meetings" element={<Guard><Meetings /></Guard>} />
<Route path="/contracts" element={<Guard><Contracts /></Guard>} />
<Route path="/partners" element={<Guard><Partners /></Guard>} />
<Route path="/knowledge" element={<Guard><KnowledgeBase /></Guard>} />
<Route path="/emails" element={<Guard><Emails /></Guard>} />
<Route path="/curriculum" element={<Guard><CurriculumTemplates /></Guard>} />

// Client portal
<Route path="/portal" element={<RouteGuard allowedRoles={['client']}><Portal /></RouteGuard>} />

// 404
<Route path="*" element={<NotFound />} />
```

---

## 5. Layout Components

### 5.1 AppShell (`src/components/layout/AppShell.tsx`)

Wraps all admin/team pages. Structure:
```
SidebarProvider
  ├── AppSidebar (collapsible sidebar)
  ├── Main content area
  │   ├── Header (h-10, sticky, backdrop-blur, contains SidebarTrigger on mobile + NotificationBell)
  │   └── <main> with padding (px-6 md:px-8 pb-20 md:pb-8 pt-2)
  ├── CommandPalette (global)
  └── MobileTabBar (bottom tabs on mobile)
```

### 5.2 AppSidebar (`src/components/layout/AppSidebar.tsx`)

Uses shadcn/ui `<Sidebar collapsible="icon">`. Two nav groups:

**Menu group:**
Home(/), Daily Brief(/daily), Projects(/projects), Tasks(/tasks), Clients(/clients), Insights(/insights), Workshops(/workshops), Meetings(/meetings), Invoices(/invoices), Contracts(/contracts)

**Workspace group:**
Curriculum(/curriculum), Forms(/forms), Emails(/emails), Client Portal(/portal), Services(/services), Partners(/partners), Knowledge Base(/knowledge), AI Assistant(/ai), Settings(/settings)

**Features:**
- Logo header with "N" icon + "NDG Hub" text (hidden when collapsed)
- Search trigger button that dispatches `⌘K` keyboard event
- Active nav item has `bg-accent-muted border-l-2 border-accent` styling
- Footer shows display name, sign out button, and collapse toggle
- Icons from lucide-react, strokeWidth 1.5 (2 when active)

### 5.3 CommandPalette (`src/components/layout/CommandPalette.tsx`)

- Uses shadcn/ui `<CommandDialog>`
- Triggered by `⌘K` / `Ctrl+K` keyboard shortcut
- Lists all pages grouped by: Core, Delivery, Commercial, Engage, Admin
- Navigates to selected page on selection

### 5.4 MobileTabBar

Bottom tab bar for mobile (below md breakpoint). Shows: Home, Projects, Tasks, Invoices, with a "More" option.

---

## 6. Database Schema (29 tables)

### 6.1 Core Entities

**`organisations`**
- id (uuid, PK), name, sector, email, phone, website, address, notes, status (default 'active'), quickbooks_id, created_at, updated_at

**`contacts`**
- id, organisation_id (FK→organisations), name, email, phone, job_title, is_primary (bool), notes, created_at, updated_at

**`projects`**
- id, name, organisation_id (FK), status (default 'contracting'), budget (numeric), start_date, end_date, external_ref, notes, intended_neuro_phase, created_at, updated_at

**`deliveries`**
- id, title, project_id (FK→projects), organisation_id (FK→organisations), service_id (FK→services), status (default 'planning'), delivery_date, location, duration_minutes, delegate_count, neuro_phase, kirkpatrick_level, satisfaction_score, facilitator_id, feedback_form_id, notes, created_at, updated_at

**`sessions`**
- id, title, delivery_id (FK→deliveries), project_id (FK→projects), session_type, duration_minutes, content_status (default 'draft'), position, created_at, updated_at

**`session_agenda_items`**
- id, session_id (FK→sessions), title, type (intro/activity/break/debrief/energiser), duration_minutes, method, materials, position, created_at

**`tasks`**
- id, title, description, project_id (FK→projects), delivery_id (FK→deliveries), status (default 'todo'), priority (default 'medium'), due_date, assignee_id, parent_task_id (self-FK), created_at, updated_at

**`services`**
- id, name, category, price (numeric), duration_minutes, neuro_phase, description, active (bool, default true), created_at, updated_at

### 6.2 Commercial

**`contracts`**
- id, title, type (master/project/sow/amendment), organisation_id (FK), project_id (FK), parent_contract_id (self-FK), value (numeric), start_date, end_date, status (default 'draft'), notes, created_at, updated_at

**`invoices`**
- id, invoice_number, project_id (FK), organisation_id (FK), subtotal (numeric), vat (numeric), total (numeric), issue_date, due_date, paid_date, status (default 'draft'), quickbooks_id, notes, created_at, updated_at

**`invoice_items`**
- id, invoice_id (FK→invoices), delivery_id (FK→deliveries), service_id (FK→services), description, quantity, unit_price (numeric), total (numeric), created_at

### 6.3 Content & Forms

**`forms`**
- id, title, description, type (feedback/intake/assessment/survey/registration), project_id (FK), delivery_id (FK), fields (jsonb), active (bool, default true), kirkpatrick_level, created_at, updated_at

**`form_responses`**
- id, form_id (FK→forms), data (jsonb), respondent_name, respondent_email, submitted_at, created_at

**`documents`**
- id, project_id (FK), delivery_id (FK), name, file_url, file_type, uploaded_by, created_at

**`notes`**
- id, project_id (FK), user_id, content (text), created_at, updated_at

**`project_updates`**
- id, project_id (FK), user_id, content (text), update_type, created_at

**`knowledge_articles`**
- id, title, content (text), category, tags (text[]), created_at, updated_at

**`curriculum_workshops`**
- id, title, service_id (FK→services), neuro_phase, default_agenda (jsonb), materials (jsonb), partner_variants (jsonb), created_at, updated_at

**`emails`**
- id, subject, from_address, to_address, snippet, body, thread_id, gmail_id, organisation_id (FK), project_id (FK), received_at, created_at

### 6.4 AI & Analytics

**`ai_conversations`**
- id, user_id, agent, messages (jsonb), created_at, updated_at

**`ai_generations`**
- id, user_id, model, tokens_used, prompt_hash, agent, created_at

**`daily_states`**
- id, user_id, date, energy_level (int), focus_level (int), mood (text), notes, is_delivery_day (bool), created_at
- Unique constraint: (user_id, date)

### 6.5 System

**`profiles`**
- id (FK→auth.users), display_name, avatar_url, telegram_chat_id, created_at, updated_at

**`user_roles`**
- id, user_id (FK→auth.users), role (app_role enum: admin/team/client), created_at

**`client_portal_access`**
- id, user_id (FK), organisation_id (FK), permissions (jsonb), created_at

**`notifications`**
- id, user_id, title, message, type (info/warning/success/error), read (bool, default false), created_at

**`activity_log`**
- id, user_id, entity_type, entity_id, action (INSERT/UPDATE/DELETE), metadata (jsonb), created_at

**`meetings`**
- id, title, type, scheduled_at (timestamptz), duration_minutes, location, organisation_id (FK), project_id (FK), contact_id (FK), notes, attendees (jsonb), gcal_event_id, created_at, updated_at

**`partners`**
- id, name, type, contact_email, commission_rate (numeric), notes, created_at, updated_at

### 6.6 Database Triggers

1. **`on_auth_user_created`** → `handle_new_user()` — creates `profiles` row + `user_roles` row with default `team` role
2. **`log_activity`** on `projects`, `tasks`, `deliveries`, `invoices`, `contracts`, `meetings` → writes to `activity_log`
3. **`update_updated_at`** on various tables → auto-sets `updated_at` to `now()`

### 6.7 Row-Level Security

Every table has RLS enabled:
- **Admin:** Full CRUD via `has_role(auth.uid(), 'admin')` helper function
- **Team:** Read + write on operational tables via `is_admin_or_team(auth.uid())` helper function
- **Client:** Read-only on own org's data via `client_portal_access` join
- **Public:** Active forms readable by anyone; `form_responses` insertable by anyone

### 6.8 Storage Bucket

| Bucket | Public | Purpose |
|--------|--------|---------|
| `documents` | Yes | Project/delivery file uploads |

---

## 7. App Entry Point (`App.tsx`)

```tsx
<QueryClientProvider>
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* all routes as listed in section 4.5 */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
</QueryClientProvider>
```

Call `initTheme()` in a `useEffect` on app mount.

---

## 8. ADHD-Informed Design Rules

These rules apply to ALL subsequent PRDs:
- No infinite scroll. No nested navigation. Everything visible without clicking.
- Checkboxes are big and satisfying.
- Colour-coded urgency throughout (use the status badge system).
- Per-service pricing from a services catalogue with fixed prices. NO day rates.
