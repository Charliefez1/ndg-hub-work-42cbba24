
-- Activity log triggers for key tables
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.activity_log (entity_type, entity_id, action, user_id, metadata)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    auth.uid(),
    jsonb_build_object('table', TG_TABLE_NAME)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_activity_projects AFTER INSERT OR UPDATE OR DELETE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER trg_activity_tasks AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER trg_activity_deliveries AFTER INSERT OR UPDATE OR DELETE ON public.deliveries
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER trg_activity_invoices AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER trg_activity_contracts AFTER INSERT OR UPDATE OR DELETE ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER trg_activity_meetings AFTER INSERT OR UPDATE OR DELETE ON public.meetings
FOR EACH ROW EXECUTE FUNCTION public.log_activity();
