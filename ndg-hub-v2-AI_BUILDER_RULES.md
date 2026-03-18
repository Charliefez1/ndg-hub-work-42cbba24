# NDG Hub v2 — AI Builder Rules

> **Meta-rule:** Before proposing any structural change, read `ARCHITECTURE.md`. Before adding features, check `PRD.md`. Before changing build order, check `PLAN.md`. These three documents are your source of truth. If something contradicts them, ask — don't override.

---

## Project Identity

- **Product:** NDG Hub v2 — internal work management platform for Neurodiversity Global.
- **Stack:** React + Vite + TypeScript, Supabase (Postgres + Auth + Edge Functions + Realtime + Storage), shadcn/ui, Tailwind CSS, TanStack React Query, React Router v6, Lucide React icons.
- **AI:** Claude API (Sonnet for generation, Haiku for extraction) via Supabase Edge Functions.
- **Target:** 2-5 internal users + up to 50 client portal users. Not a SaaS product.

---

## Core Behaviours

### Do This
- **Be precise.** Use exact table names, column names, and route paths from the spec. No synonyms, no abbreviations.
- **Ask before acting** when: adding a new database table, changing a table schema, adding a new route, modifying RLS policies, changing the auth flow, or altering an Edge Function signature.
- **Implement incrementally.** Complete one feature fully (DB → Edge Function → hook → component → test) before starting the next.
- **Read before writing.** Before modifying any file, read it first. Before creating a new component, check if a similar one already exists.

### Never Do This
- Never assume missing context. If the spec doesn't cover something, ask.
- Never make breaking changes without flagging them first.
- Never skip the preview step for AI-generated content — always show the user what the AI produced before creating records.

---

## Coding Standards

### File & Naming Conventions
- **Components:** PascalCase. One component per file. `ProjectDetail.tsx`, `DeliveryCard.tsx`.
- **Hooks:** camelCase with `use` prefix. `useProjects.ts`, `useAI.ts`, `useAIContext.ts`.
- **Utilities:** camelCase. `status-colors.ts`, `format-currency.ts`, `format-date.ts`.
- **Edge Functions:** kebab-case. `scaffold-project`, `generate-invoice`, `ai-assistant`.
- **Database tables:** snake_case plural. `organisations`, `deliveries`, `session_agenda_items`.
- **Database columns:** snake_case. `neuro_phase`, `kirkpatrick_level`, `delivery_date`.
- **UI labels vs DB names:** UI says "Workshops" → DB says `deliveries`. UI says "Clients" → DB says `organisations`. Always use DB names in code, UI names in user-facing text.

### File Size Limits
- Components: aim for < 200 lines. If larger, extract sub-components.
- Hooks: aim for < 100 lines.
- Edge Functions: aim for < 150 lines. Extract shared utilities.

### Error Handling
- **Edge Functions:** Always return `{data, error}` shape. HTTP 400 for validation errors, 401 for auth, 404 for not found, 500 for unexpected.
- **React:** TanStack Query handles loading/error states. Use `isLoading` → skeleton loader. Use `isError` → inline error banner with retry button. Never show raw error messages to users.
- **Optimistic updates:** For task status changes, form submissions, and note edits. Rollback on error via TanStack Query's `onError` callback.

### Imports
- Absolute imports via `@/` alias: `import { Button } from '@/components/ui/button'`.
- Group imports: React → external libs → internal components → hooks → utils → types.

---

## Stack-Specific Rules

### React + TypeScript
- Functional components only. No class components.
- TypeScript strict mode. No `any` types. Define interfaces for all props, API responses, and database row types.
- Use `React.FC` sparingly — prefer explicit return types.
- All data fetching via TanStack React Query. Never `fetch` directly in components.
- All state that persists across page changes → React Query cache or Supabase Realtime subscription.
- All state that's local to a component → `useState` or `useReducer`.

### Supabase Client
```typescript
// DO THIS — single-table read
const { data } = await supabase
  .from('projects')
  .select('*, organisation:organisations(name)')
  .eq('status', 'delivery');

// DO THIS — single-table write
const { data, error } = await supabase
  .from('tasks')
  .update({ status: 'done' })
  .eq('id', taskId);

// NEVER DO THIS — multi-table operation in React
// Instead, call an Edge Function
const project = await supabase.from('projects').insert({...});
const delivery = await supabase.from('deliveries').insert({project_id: project.id});
const session = await supabase.from('sessions').insert({delivery_id: delivery.id});
// ❌ This should be scaffold-project Edge Function
```

### Edge Functions (Deno/TypeScript)
- All multi-table operations must be Edge Functions.
- All status transitions must go through Edge Functions (never direct column updates).
- All computed values (invoice totals, satisfaction scores) calculated in Edge Functions.
- Edge Functions handle: validation → operation → side-effects (notifications, activity_log) → response.
- Auth: verify JWT from `Authorization` header. Extract user_id for RLS context.

### shadcn/ui
- All interactive components extend shadcn primitives: Button, Card, Input, Select, Dialog, Popover, Tabs, Table, Badge, Toast, Skeleton, Accordion.
- Customise via Tailwind config + CSS custom properties only. Never override shadcn component internals directly.
- Use `cn()` utility for conditional class merging.

### Tailwind CSS
- All colours via CSS custom properties mapped in `tailwind.config.ts`:
```typescript
colors: {
  background: 'var(--background)',
  surface: 'var(--surface)',
  'surface-2': 'var(--surface-2)',
  border: 'var(--border)',
  primary: 'var(--primary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  destructive: 'var(--destructive)',
  // ... all tokens
}
```
- **NEVER use raw hex values in className strings.** Always reference tokens.
- **NEVER use inline `style={{ color: '#EF4444' }}`.** Use `className="text-destructive"`.

### Status Colours
- Create and use `src/lib/status-colors.ts`:
```typescript
export function getStatusColor(entity: 'project' | 'delivery' | 'invoice' | 'task' | 'neuro_phase', status: string): string {
  // Returns Tailwind class like 'text-success', 'bg-warning/15'
}
```
- **All badges and tags use this function.** Never hard-code status → colour mapping in JSX.

---

## Security Rules

### Authentication
- Supabase Auth for all authentication. Email/password for admin + team. Magic link for client portal.
- On signup: auto-create `profiles` row with role.
- Route guard middleware: check `profiles.role`. Redirect `client` users to `/portal`. Block `team` from admin-only pages (if any).

### Row Level Security
- RLS enabled on EVERY table. No exceptions.
- 3 roles only: `admin` (full access), `team` (read all, write assigned), `client` (read own org via `client_portal_access`).
- Test RLS policies before shipping. Verify a client user cannot see other orgs' data.

### Environment Variables
- All API keys (Claude API, Google, QuickBooks, Telegram) in Supabase Edge Function secrets. Never in client-side code.
- `.env` files are for local Supabase URL and anon key only. Never commit secrets.

### Data Protection
- No client data logged to console in production.
- Form responses containing personal data follow UK GDPR.
- AI conversations stored in `ai_conversations` with user_id — no cross-user access.

---

## What Never to Do

| Anti-Pattern | Why | Correct Approach |
|---|---|---|
| Business logic in React components | V1 failed because of this. React renders UI only. | Edge Functions for multi-table ops, computed values, status transitions. |
| Direct status column updates | Skips validation + side-effects (notifications, activity_log). | Always call the relevant `advance-*-status` Edge Function. |
| Raw hex colours in components | Breaks theming (light/dark/accent). | Use CSS custom properties via Tailwind tokens. |
| `day_rate` or `total_days` anywhere | NDG uses per-service pricing, not day rates. | `services.price` via `deliveries.service_id`. |
| `service_type` enum on projects | A project can have multiple service types across its deliveries. | Service lives on each delivery via `service_id`. |
| Creating records from AI output without preview | Users must confirm before data is written. | Show preview modal → user confirms → then create. |
| Fetching data in `useEffect` | Bypasses cache, loading states, error handling. | TanStack React Query: `useQuery`, `useMutation`. |
| Putting `neuro_phase` on projects as the primary field | A single project can have deliveries in different phases. | `neuro_phase` lives on `deliveries`. Projects get `intended_neuro_phase` as a hint only. |
| Skipping empty states | First-run experience is blank and confusing. | Every list view has a message + primary action button. |
| Skipping skeleton loaders | Flash of empty content. | Every data-fetching component shows skeletons while loading. |

---

## When to Stop & Ask

Stop and ask for human confirmation before:

1. **Adding a new database table** not in the schema.
2. **Changing a column type or adding/removing columns** on existing tables.
3. **Creating a new route** not in the routing spec.
4. **Modifying RLS policies** — security changes need human review.
5. **Changing the auth flow** (login, signup, magic link, role assignment).
6. **Adding a new npm dependency** not in the stack spec.
7. **Exceeding 200 lines** in a single component — suggest extraction first.
8. **Implementing a Phase 2/3 feature** during Phase 1 work.
9. **Any change to the invoice calculation logic** — pricing is a critical path.
10. **Any change to AI Edge Function signatures** — these have specific input/output contracts.

---

*These rules apply to every AI coding session for NDG Hub v2. Read ARCHITECTURE.md for system structure and PLAN.md for build sequence.*
