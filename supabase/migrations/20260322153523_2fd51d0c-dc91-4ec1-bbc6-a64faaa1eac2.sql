
-- Fix Bug 1: client_read_own_contacts references wrong table
DROP POLICY "client_read_own_contacts" ON public.contacts;
CREATE POLICY "client_read_own_contacts" ON public.contacts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM client_portal_access
    WHERE client_portal_access.user_id = auth.uid()
    AND client_portal_access.organisation_id = contacts.organisation_id
  )
);

-- Fix Bug 2: client_read_own_orgs references wrong column
DROP POLICY "client_read_own_orgs" ON public.organisations;
CREATE POLICY "client_read_own_orgs" ON public.organisations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM client_portal_access
    WHERE client_portal_access.user_id = auth.uid()
    AND client_portal_access.organisation_id = organisations.id
  )
);

-- Fix Bug 3: Remove duplicate triggers (keep the trg_ prefixed ones, drop the log_activity_ prefixed duplicates)
DROP TRIGGER IF EXISTS log_activity_projects ON public.projects;
DROP TRIGGER IF EXISTS log_activity_deliveries ON public.deliveries;
DROP TRIGGER IF EXISTS log_activity_tasks ON public.tasks;
DROP TRIGGER IF EXISTS log_activity_contracts ON public.contracts;
DROP TRIGGER IF EXISTS log_activity_invoices ON public.invoices;
DROP TRIGGER IF EXISTS log_activity_meetings ON public.meetings;

-- Remove duplicate updated_at triggers (keep update_updated_at_ prefix, drop update_X_updated_at)
DROP TRIGGER IF EXISTS update_organisations_updated_at ON public.organisations;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
DROP TRIGGER IF EXISTS update_deliveries_updated_at ON public.deliveries;
DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
DROP TRIGGER IF EXISTS update_forms_updated_at ON public.forms;
DROP TRIGGER IF EXISTS update_contracts_updated_at ON public.contracts;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;
DROP TRIGGER IF EXISTS update_knowledge_updated_at ON public.knowledge_articles;
DROP TRIGGER IF EXISTS update_ai_convos_updated_at ON public.ai_conversations;

-- Missing DELETE policies for team
CREATE POLICY "team_delete_contracts" ON public.contracts FOR DELETE USING (is_admin_or_team(auth.uid()));
CREATE POLICY "team_delete_deliveries" ON public.deliveries FOR DELETE USING (is_admin_or_team(auth.uid()));
CREATE POLICY "team_delete_meetings" ON public.meetings FOR DELETE USING (is_admin_or_team(auth.uid()));
CREATE POLICY "team_delete_invoices" ON public.invoices FOR DELETE USING (is_admin_or_team(auth.uid()));
CREATE POLICY "team_delete_orgs" ON public.organisations FOR DELETE USING (is_admin_or_team(auth.uid()));
CREATE POLICY "team_delete_updates" ON public.project_updates FOR DELETE USING (is_admin_or_team(auth.uid()));
CREATE POLICY "team_update_updates" ON public.project_updates FOR UPDATE USING (is_admin_or_team(auth.uid()));

-- Missing UPDATE/DELETE for invoice_items
CREATE POLICY "team_update_invoice_items" ON public.invoice_items FOR UPDATE USING (is_admin_or_team(auth.uid()));
CREATE POLICY "team_delete_invoice_items" ON public.invoice_items FOR DELETE USING (is_admin_or_team(auth.uid()));

-- Missing UPDATE for documents
CREATE POLICY "team_update_documents" ON public.documents FOR UPDATE USING (is_admin_or_team(auth.uid()));

-- Missing DELETE for task_custom_field_values
CREATE POLICY "team_delete_field_values" ON public.task_custom_field_values FOR DELETE USING (is_admin_or_team(auth.uid()));
