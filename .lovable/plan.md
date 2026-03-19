

## Full Audit — Logical Next Steps for NDG Hub

### Current State Summary
- 29 database tables with RLS, 15 edge functions, full CRUD hooks, 3-role auth (admin/team/client)
- Google SSO just added, email/password auth working
- All core pages built: Dashboard, Projects, Workshops, Tasks, Invoices, Contracts, Forms, Daily Brief, Insights, AI Assistant, Settings, Portal, etc.
- Console shows ref warnings on `AppShell` and `Badge` in Invoices page (minor)

### Issues Found

1. **No password reset flow** — No forgot-password link or `/reset-password` page exists. Users who forget their password have no recovery path.

2. **Console ref warnings** — `AppShell` and `Badge` components receive refs but aren't wrapped in `forwardRef`. Non-critical but noisy.

3. **Database triggers missing** — The `handle_new_user` trigger on `auth.users` and `log_activity` triggers documented in TECH_SPEC are not present in the database (triggers list is empty). This means new signups may not get profiles/roles created, and activity logging is broken.

### Recommended Next Steps (Priority Order)

| # | Step | Why |
|---|------|-----|
| 1 | **Restore database triggers** | Critical — without `handle_new_user`, Google SSO and email signups won't create profiles or assign roles, breaking auth entirely. `log_activity` triggers are needed for the audit trail. |
| 2 | **Add password reset flow** | Standard auth feature gap — add "Forgot password?" link on login, plus a `/reset-password` page that calls `supabase.auth.updateUser({ password })`. |
| 3 | **Fix forwardRef warnings** | Wrap `AppShell` and `Badge` with `React.forwardRef` to silence console warnings. |
| 4 | **Client portal onboarding** | Currently no way to invite clients or create `client_portal_access` rows from the UI — admin must do this manually. Add an "Invite Client" flow from the Clients page. |
| 5 | **Mobile responsiveness pass** | Invoice KPI cards use `grid-cols-3` without responsive breakpoints — will break on small screens. Other pages likely have similar issues. |

### Technical Details

**Step 1 — Restore triggers (migration):**
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER log_activity_projects AFTER INSERT OR UPDATE OR DELETE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.log_activity();
-- (repeat for tasks, deliveries, invoices, contracts, meetings)

CREATE TRIGGER update_updated_at_projects BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- (repeat for all tables with updated_at)
```

**Step 2 — Password reset:** Two new components + one new route (`/reset-password`), plus a "Forgot password?" link on the login form.

**Step 3 — forwardRef:** Minor refactor of `AppShell` and `Badge` components.

