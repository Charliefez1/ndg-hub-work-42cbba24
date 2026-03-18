# NDG Hub — Technical Specification

> Last updated: 2026-03-18

## 1. Architecture Overview

**Type:** Single-page application (SPA) with serverless backend  
**Hosting:** Lovable Cloud (Supabase-powered)  
**Deployment:** Automatic via Lovable CI

```
┌─────────────────────────────────┐
│  React SPA (Vite + TypeScript)  │
│  Tailwind CSS + shadcn/ui       │
│  React Router v6 (client-side)  │
└──────────┬──────────────────────┘
           │ HTTPS
┌──────────▼──────────────────────┐
│  Lovable Cloud (Supabase)       │
│  ┌─────────────────────────┐    │
│  │ PostgreSQL 15 + RLS     │    │
│  │ Auth (email/password)   │    │
│  │ Storage (documents)     │    │
│  │ Edge Functions (Deno)   │    │
│  │ Realtime (websockets)   │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

## 2. Frontend Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | ^18.3 |
| Build tool | Vite | ^8.0 |
| Language | TypeScript | ^5.8 |
| Styling | Tailwind CSS | ^3.4 |
| Component library | shadcn/ui (Radix primitives) | Latest |
| Routing | React Router DOM | ^6.30 |
| State / Data fetching | TanStack React Query | ^5.83 |
| Forms | React Hook Form + Zod | ^7.61 / ^3.25 |
| Charts | Recharts | ^2.15 |
| Animations | Tailwind Animate | ^1.0 |
| Markdown | react-markdown | ^10.1 |
| Notifications (toast) | Sonner | ^1.7 |
| Date utilities | date-fns | ^3.6 |

## 3. Design System

### Typography
- **Display / headings:** Satoshi 700
- **Body:** General Sans 400/500/600
- **Monospace:** JetBrains Mono 400/500

### Theming
- CSS custom properties in `src/index.css` (HSL values)
- Dark mode via `[data-theme="dark"]` selector
- Accent colour system (blue, green, purple, rose) switchable in Settings
- All colours referenced through semantic Tailwind tokens — no hardcoded values in components

### Key Tokens
`--background`, `--surface`, `--surface-2`, `--border`, `--foreground`, `--text-2`, `--text-3`, `--primary`, `--success`, `--warning`, `--destructive`, `--info`, `--purple`, `--cyan`, `--pink`

## 4. Backend — Database Schema (29 tables)

### Core Entities
| Table | Purpose |
|-------|---------|
| `organisations` | Client companies |
| `contacts` | People at organisations |
| `projects` | Engagements linked to organisations |
| `deliveries` | Workshops/sessions within projects |
| `sessions` | Individual sessions within deliveries |
| `session_agenda_items` | Agenda items within sessions |
| `tasks` | To-dos linked to projects/deliveries |
| `services` | Service catalogue (pricing, duration) |
| `contracts` | Legal agreements per org/project |
| `invoices` | Financial records per project |
| `invoice_items` | Line items per invoice |

### Content & Knowledge
| Table | Purpose |
|-------|---------|
| `forms` | Dynamic form definitions (feedback, intake) |
| `form_responses` | Submitted form data |
| `documents` | File metadata (links to Storage bucket) |
| `notes` | User notes on projects |
| `project_updates` | Status update feed per project |
| `knowledge_articles` | Internal wiki/KB articles |
| `curriculum_workshops` | Reusable workshop agenda templates |
| `emails` | Tracked Gmail threads |

### AI & Analytics
| Table | Purpose |
|-------|---------|
| `ai_conversations` | Chat history per agent |
| `ai_generations` | LLM call log (model, tokens, prompt hash) |
| `daily_states` | Energy/focus/mood check-ins |

### System
| Table | Purpose |
|-------|---------|
| `profiles` | User display names, avatars |
| `user_roles` | Role assignments (admin/team/client) |
| `client_portal_access` | Per-org portal permissions |
| `notifications` | In-app notification queue |
| `activity_log` | Auto-logged CRUD audit trail |
| `meetings` | Scheduled meetings |
| `partners` | Delivery/referral partners |

### Row-Level Security
Every table has RLS enabled. Access model:
- **Admin:** Full CRUD on all tables via `has_role(auth.uid(), 'admin')`
- **Team:** Read + write on operational tables via `is_admin_or_team(auth.uid())`
- **Client:** Read-only on own org's projects, deliveries, invoices, contracts via `client_portal_access` join
- **Public:** Active forms readable; form responses insertable by anyone

## 5. Backend — Edge Functions (15)

| Function | Trigger | Purpose |
|----------|---------|---------|
| `advance-project-status` | Manual | Move project through status pipeline |
| `advance-delivery-status` | Manual | Move delivery through status pipeline |
| `scaffold-project` | Manual | Auto-create deliveries + tasks from template |
| `generate-invoice` | Manual | Create invoice from project deliveries |
| `recalculate-invoice` | Manual | Recompute invoice totals |
| `mark-invoice-paid` | Manual | Set invoice status + paid_date |
| `send-invoice` | Manual | Email invoice to client |
| `ai-assistant` | Manual | Multi-agent chat (general, planner, writer, analyst) |
| `ai-extract` | Manual | Extract structured data from text via LLM |
| `ai-session-planner` | Manual | Generate session agendas via LLM |
| `ai-impact-reporter` | Manual | Generate impact reports from feedback data |
| `daily-brief` | Manual | Generate daily summary with red flags |
| `insights-business` | Manual | Aggregate business KPIs |
| `insights-personal` | Manual | Personal energy/focus analytics |
| `process-form-response` | Manual | Post-processing on form submissions |

## 6. Backend — Database Triggers

| Trigger | Table | Function |
|---------|-------|----------|
| `on_auth_user_created` | `auth.users` | `handle_new_user()` — creates profile + team role |
| `log_activity` | `projects`, `tasks`, `deliveries`, `invoices`, `contracts`, `meetings` | `log_activity()` — writes to `activity_log` |
| `update_updated_at` | Various | `update_updated_at_column()` — auto-set `updated_at` |

## 7. Authentication & Authorization

- **Method:** Email + password (Supabase Auth)
- **Auto-confirm:** Enabled (no email verification required)
- **Roles:** Enum `app_role` = `admin | team | client`
- **Role storage:** `user_roles` table (not on profiles — prevents privilege escalation)
- **Route guards:** `<RouteGuard allowedRoles={[...]}>`
- **New user flow:** Trigger creates `profiles` row + `user_roles` row (default: `team`)

## 8. Storage

| Bucket | Public | Purpose |
|--------|--------|---------|
| `documents` | Yes | Project files (uploaded via DocumentsTab) |

File upload flow: Client → Supabase Storage → public URL saved to `documents` table.

## 9. Key Conventions

- **Hooks pattern:** One hook file per entity (`useTasks.ts`, `useProjects.ts`, etc.) exporting `useX`, `useCreateX`, `useUpdateX`, `useDeleteX`
- **Query keys:** Array-based (`['tasks', filters]`)
- **Page layout:** All pages wrapped in `<AppShell>` (sidebar + header)
- **Status colours:** Centralized in `src/lib/status-colors.ts`
- **Toast notifications:** Sonner (`toast.success()`, `toast.error()`)
- **No backend references in UI copy:** Always say "backend" not "Supabase"
