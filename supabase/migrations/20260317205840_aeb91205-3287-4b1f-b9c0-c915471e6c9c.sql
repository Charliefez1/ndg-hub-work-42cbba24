
-- =============================================================
-- NDG Hub v2 — Step 1.1: Database Foundation
-- All 26+ tables + RLS + policies + triggers
-- =============================================================

-- 0. Role enum & has_role security definer
CREATE TYPE public.app_role AS ENUM ('admin', 'team', 'client');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_team(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'team'))
$$;

CREATE POLICY "admin_manage_roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users_read_own_role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- 1. Organisations (UI: "Clients")
CREATE TABLE public.organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, sector TEXT, email TEXT, phone TEXT, website TEXT, address TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  notes TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_orgs" ON public.organisations FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_orgs" ON public.organisations FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_write_orgs" ON public.organisations FOR INSERT WITH CHECK (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_update_orgs" ON public.organisations FOR UPDATE USING (public.is_admin_or_team(auth.uid()));
CREATE TRIGGER update_organisations_updated_at BEFORE UPDATE ON public.organisations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Contacts
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL, email TEXT, phone TEXT, job_title TEXT,
  is_primary BOOLEAN DEFAULT false, notes TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_contacts" ON public.contacts FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_contacts" ON public.contacts FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_write_contacts" ON public.contacts FOR INSERT WITH CHECK (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_update_contacts" ON public.contacts FOR UPDATE USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_delete_contacts" ON public.contacts FOR DELETE USING (public.is_admin_or_team(auth.uid()));

-- 3. Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'team' CHECK (role IN ('admin', 'team', 'client')),
  display_name TEXT, avatar_url TEXT, telegram_chat_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "admin_full_profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: auto-create profile + user_role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (NEW.id, 'team', COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'team');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Services
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('workshop', 'service')),
  price NUMERIC(10,2) NOT NULL, description TEXT, default_duration_minutes INT,
  default_neuro_phase TEXT CHECK (default_neuro_phase IN ('needs', 'engage', 'understand', 'realise', 'ongoing')),
  active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_services" ON public.services FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_services" ON public.services FOR SELECT USING (public.is_admin_or_team(auth.uid()));

-- 5. Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'contracting' CHECK (status IN ('contracting', 'project_planning', 'session_planning', 'content_review', 'delivery', 'feedback_analytics', 'closed')),
  intended_neuro_phase TEXT CHECK (intended_neuro_phase IN ('needs', 'engage', 'understand', 'realise', 'ongoing')),
  budget NUMERIC(12,2), start_date DATE, end_date DATE,
  owner_id UUID REFERENCES auth.users(id), external_ref TEXT, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_projects" ON public.projects FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_projects" ON public.projects FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_write_projects" ON public.projects FOR INSERT WITH CHECK (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_update_projects" ON public.projects FOR UPDATE USING (public.is_admin_or_team(auth.uid()));
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Deliveries (UI: "Workshops")
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  title TEXT NOT NULL,
  service_id UUID REFERENCES public.services(id),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'scheduled', 'in_progress', 'delivered', 'follow_up', 'complete', 'cancelled')),
  neuro_phase TEXT CHECK (neuro_phase IN ('needs', 'engage', 'understand', 'realise', 'ongoing')),
  kirkpatrick_level SMALLINT CHECK (kirkpatrick_level BETWEEN 1 AND 4),
  delivery_date DATE, duration_minutes INT, delegate_count INT, location TEXT,
  facilitator_id UUID REFERENCES auth.users(id),
  feedback_form_id UUID,
  satisfaction_score NUMERIC(3,1), sort_order INT DEFAULT 0, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_deliveries" ON public.deliveries FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_deliveries" ON public.deliveries FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_write_deliveries" ON public.deliveries FOR INSERT WITH CHECK (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_update_deliveries" ON public.deliveries FOR UPDATE USING (public.is_admin_or_team(auth.uid()));
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Sessions
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id),
  title TEXT NOT NULL,
  session_type TEXT DEFAULT 'workshop' CHECK (session_type IN ('workshop', 'coaching', 'meeting')),
  session_date TIMESTAMPTZ, duration_minutes INT DEFAULT 90,
  neuro_phase TEXT CHECK (neuro_phase IN ('needs', 'engage', 'understand', 'realise', 'ongoing')),
  facilitator_id UUID REFERENCES auth.users(id),
  content_status TEXT DEFAULT 'draft' CHECK (content_status IN ('draft', 'ready_for_review', 'approved', 'delivered')),
  sort_order INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_sessions" ON public.sessions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_sessions" ON public.sessions FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_write_sessions" ON public.sessions FOR INSERT WITH CHECK (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_update_sessions" ON public.sessions FOR UPDATE USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_delete_sessions" ON public.sessions FOR DELETE USING (public.is_admin_or_team(auth.uid()));
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Session Agenda Items
CREATE TABLE public.session_agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('intro', 'activity', 'break', 'debrief', 'energiser')),
  duration_minutes INT NOT NULL, position INT NOT NULL,
  method TEXT, description TEXT, materials TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.session_agenda_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_agenda" ON public.session_agenda_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_agenda" ON public.session_agenda_items FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_write_agenda" ON public.session_agenda_items FOR INSERT WITH CHECK (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_update_agenda" ON public.session_agenda_items FOR UPDATE USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_delete_agenda" ON public.session_agenda_items FOR DELETE USING (public.is_admin_or_team(auth.uid()));

-- 9. Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'review', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  project_id UUID REFERENCES public.projects(id),
  delivery_id UUID REFERENCES public.deliveries(id),
  assignee UUID REFERENCES auth.users(id),
  due_date DATE, parent_task_id UUID REFERENCES public.tasks(id),
  description TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_tasks" ON public.tasks FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_tasks" ON public.tasks FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_write_tasks" ON public.tasks FOR INSERT WITH CHECK (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_update_tasks" ON public.tasks FOR UPDATE USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_delete_tasks" ON public.tasks FOR DELETE USING (public.is_admin_or_team(auth.uid()));
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Daily States
CREATE TABLE public.daily_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  energy_level INT CHECK (energy_level BETWEEN 1 AND 5),
  focus_level INT CHECK (focus_level BETWEEN 1 AND 5),
  mood TEXT, notes TEXT, created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE public.daily_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_daily" ON public.daily_states FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "admin_read_daily" ON public.daily_states FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 11. Forms
CREATE TABLE public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feedback', 'survey', 'booking', 'follow_up', 'assessment')),
  description TEXT, fields JSONB NOT NULL DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  kirkpatrick_level SMALLINT CHECK (kirkpatrick_level BETWEEN 1 AND 4),
  delivery_id UUID REFERENCES public.deliveries(id),
  project_id UUID REFERENCES public.projects(id),
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_forms" ON public.forms FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_forms" ON public.forms FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_write_forms" ON public.forms FOR INSERT WITH CHECK (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_update_forms" ON public.forms FOR UPDATE USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_delete_forms" ON public.forms FOR DELETE USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "public_read_active_forms" ON public.forms FOR SELECT USING (active = true);
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FK from deliveries to forms
ALTER TABLE public.deliveries ADD CONSTRAINT fk_feedback_form FOREIGN KEY (feedback_form_id) REFERENCES public.forms(id);

-- 12. Form Responses
CREATE TABLE public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL, kirkpatrick_level SMALLINT,
  submitted_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_responses" ON public.form_responses FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_responses" ON public.form_responses FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "public_insert_responses" ON public.form_responses FOR INSERT WITH CHECK (true);

-- 13. Contracts
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('msa', 'po', 'sow')),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  project_id UUID REFERENCES public.projects(id),
  parent_contract_id UUID REFERENCES public.contracts(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'expired', 'cancelled')),
  value NUMERIC(12,2), start_date DATE, end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_contracts" ON public.contracts FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_contracts" ON public.contracts FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_write_contracts" ON public.contracts FOR INSERT WITH CHECK (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_update_contracts" ON public.contracts FOR UPDATE USING (public.is_admin_or_team(auth.uid()));
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  contract_id UUID REFERENCES public.contracts(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue')),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0, vat_rate NUMERIC(4,2) DEFAULT 20.00,
  vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0, total NUMERIC(12,2) NOT NULL DEFAULT 0,
  issue_date DATE, due_date DATE, paid_date DATE, quickbooks_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_invoices" ON public.invoices FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_invoices" ON public.invoices FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_write_invoices" ON public.invoices FOR INSERT WITH CHECK (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_update_invoices" ON public.invoices FOR UPDATE USING (public.is_admin_or_team(auth.uid()));
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. Invoice Items
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id),
  service_id UUID NOT NULL REFERENCES public.services(id),
  description TEXT NOT NULL, quantity INT DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL, total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_invoice_items" ON public.invoice_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_invoice_items" ON public.invoice_items FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_write_invoice_items" ON public.invoice_items FOR INSERT WITH CHECK (public.is_admin_or_team(auth.uid()));

-- 16. Meetings
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('client', 'internal', 'sales')),
  organisation_id UUID REFERENCES public.organisations(id),
  project_id UUID REFERENCES public.projects(id),
  contact_id UUID REFERENCES public.contacts(id),
  scheduled_at TIMESTAMPTZ NOT NULL, duration_minutes INT DEFAULT 30,
  location TEXT, gcal_event_id TEXT, notes TEXT, attendees JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_meetings" ON public.meetings FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_meetings" ON public.meetings FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_write_meetings" ON public.meetings FOR INSERT WITH CHECK (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_update_meetings" ON public.meetings FOR UPDATE USING (public.is_admin_or_team(auth.uid()));

-- 17. Project Updates
CREATE TABLE public.project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL, status_snapshot JSONB,
  ai_generated BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_updates" ON public.project_updates FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_updates" ON public.project_updates FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_write_updates" ON public.project_updates FOR INSERT WITH CHECK (public.is_admin_or_team(auth.uid()));

-- 18. Notes
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT, body TEXT,
  project_id UUID REFERENCES public.projects(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_notes" ON public.notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "admin_read_notes" ON public.notes FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 19. Emails
CREATE TABLE public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_id TEXT UNIQUE, thread_id TEXT, subject TEXT,
  from_address TEXT, to_addresses TEXT[], snippet TEXT,
  organisation_id UUID REFERENCES public.organisations(id),
  project_id UUID REFERENCES public.projects(id),
  received_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_emails" ON public.emails FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_emails" ON public.emails FOR SELECT USING (public.is_admin_or_team(auth.uid()));

-- 20. Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, url TEXT NOT NULL,
  entity_type TEXT NOT NULL, entity_id UUID NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_documents" ON public.documents FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_documents" ON public.documents FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_write_documents" ON public.documents FOR INSERT WITH CHECK (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_delete_documents" ON public.documents FOR DELETE USING (public.is_admin_or_team(auth.uid()));

-- 21. Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL, title TEXT NOT NULL, body TEXT,
  read BOOLEAN DEFAULT false, entity_type TEXT, entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_update_own_notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "admin_manage_notifications" ON public.notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 22. Activity Log
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  entity_type TEXT NOT NULL, entity_id UUID NOT NULL,
  action TEXT NOT NULL, metadata JSONB, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_activity" ON public.activity_log FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_activity" ON public.activity_log FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_insert_activity" ON public.activity_log FOR INSERT WITH CHECK (public.is_admin_or_team(auth.uid()));

-- 23. Client Portal Access
CREATE TABLE public.client_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  granted_by UUID REFERENCES auth.users(id),
  permissions JSONB DEFAULT '{"can_view_invoices": true, "can_submit_forms": true, "can_view_documents": false}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.client_portal_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_portal" ON public.client_portal_access FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users_read_own_portal" ON public.client_portal_access FOR SELECT USING (auth.uid() = user_id);

-- 24. Curriculum Workshops
CREATE TABLE public.curriculum_workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, service_id UUID REFERENCES public.services(id),
  neuro_phase TEXT, materials JSONB DEFAULT '{}',
  default_agenda JSONB DEFAULT '[]', partner_variants JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.curriculum_workshops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_curriculum" ON public.curriculum_workshops FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_curriculum" ON public.curriculum_workshops FOR SELECT USING (public.is_admin_or_team(auth.uid()));

-- 25. Knowledge Articles
CREATE TABLE public.knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, content TEXT, category TEXT, tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_knowledge" ON public.knowledge_articles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_knowledge" ON public.knowledge_articles FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE TRIGGER update_knowledge_updated_at BEFORE UPDATE ON public.knowledge_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 26. Partners
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, type TEXT CHECK (type IN ('edi', 'wellbeing')),
  commission_rate NUMERIC(4,2), contact_email TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_partners" ON public.partners FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_partners" ON public.partners FOR SELECT USING (public.is_admin_or_team(auth.uid()));

-- 27. AI Generations
CREATE TABLE public.ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  agent TEXT, prompt_hash TEXT, entity_type TEXT, entity_id UUID,
  input JSONB, output TEXT, model TEXT, tokens_used INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_ai_gen" ON public.ai_generations FOR ALL USING (auth.uid() = user_id);

-- 28. AI Conversations
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  agent TEXT NOT NULL, title TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  entity_type TEXT, entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_convos" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_ai_convos_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Client-scoped read policies (need client_portal_access table to exist)
CREATE POLICY "client_read_own_orgs" ON public.organisations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.client_portal_access WHERE user_id = auth.uid() AND organisation_id = id));
CREATE POLICY "client_read_own_contacts" ON public.contacts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.client_portal_access WHERE user_id = auth.uid() AND organisation_id = organisation_id));
CREATE POLICY "client_read_own_projects" ON public.projects FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.client_portal_access WHERE user_id = auth.uid() AND organisation_id = projects.organisation_id));
CREATE POLICY "client_read_own_deliveries" ON public.deliveries FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.client_portal_access WHERE user_id = auth.uid() AND organisation_id = deliveries.organisation_id));
CREATE POLICY "client_read_own_invoices" ON public.invoices FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.client_portal_access cpa JOIN public.projects p ON p.id = invoices.project_id WHERE cpa.user_id = auth.uid() AND cpa.organisation_id = p.organisation_id));
CREATE POLICY "client_read_own_contracts" ON public.contracts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.client_portal_access WHERE user_id = auth.uid() AND organisation_id = contracts.organisation_id));
