
-- Step 1: Create automation_queue table
CREATE TABLE public.automation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  old_status text,
  new_status text NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_automation_queue" ON public.automation_queue FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "team_read_automation_queue" ON public.automation_queue FOR SELECT USING (is_admin_or_team(auth.uid()));

-- Step 2: Create trigger function for status changes
CREATE OR REPLACE FUNCTION public.queue_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.automation_queue (entity_type, entity_id, old_status, new_status)
    VALUES (TG_TABLE_NAME, NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

-- Step 3: Create triggers on projects, deliveries, invoices
CREATE TRIGGER trg_project_status_change
  AFTER UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.queue_status_change();

CREATE TRIGGER trg_delivery_status_change
  AFTER UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.queue_status_change();

CREATE TRIGGER trg_invoice_status_change
  AFTER UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.queue_status_change();

-- Index for efficient queue processing
CREATE INDEX idx_automation_queue_unprocessed ON public.automation_queue (processed, created_at) WHERE processed = false;
