
-- Task enhancements
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence_rule jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.tasks(id);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Custom fields system
CREATE TABLE IF NOT EXISTS public.task_custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  field_type text NOT NULL,
  options jsonb,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_custom_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  field_id uuid REFERENCES public.task_custom_fields(id) ON DELETE CASCADE NOT NULL,
  value jsonb,
  UNIQUE(task_id, field_id)
);

-- Task comments
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Focus sessions (Pomodoro)
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_minutes integer NOT NULL DEFAULT 25,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Automation rules
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}',
  action_type text NOT NULL,
  action_config jsonb NOT NULL DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- RLS on task_custom_fields
ALTER TABLE public.task_custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_custom_fields" ON public.task_custom_fields FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_custom_fields" ON public.task_custom_fields FOR SELECT USING (public.is_admin_or_team(auth.uid()));

-- RLS on task_custom_field_values
ALTER TABLE public.task_custom_field_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_field_values" ON public.task_custom_field_values FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_field_values" ON public.task_custom_field_values FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_write_field_values" ON public.task_custom_field_values FOR INSERT WITH CHECK (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_update_field_values" ON public.task_custom_field_values FOR UPDATE USING (public.is_admin_or_team(auth.uid()));

-- RLS on task_comments
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_comments" ON public.task_comments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_comments" ON public.task_comments FOR SELECT USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_write_comments" ON public.task_comments FOR INSERT WITH CHECK (public.is_admin_or_team(auth.uid()));
CREATE POLICY "team_delete_own_comments" ON public.task_comments FOR DELETE USING (auth.uid() = user_id);

-- RLS on focus_sessions
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_sessions" ON public.focus_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "admin_read_sessions" ON public.focus_sessions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS on automation_rules
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_automations" ON public.automation_rules FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "team_read_automations" ON public.automation_rules FOR SELECT USING (public.is_admin_or_team(auth.uid()));

-- Enable realtime on task_comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
