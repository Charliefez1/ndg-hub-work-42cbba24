
-- Activity log triggers (DROP IF EXISTS to be safe)
DROP TRIGGER IF EXISTS log_activity_projects ON public.projects;
DROP TRIGGER IF EXISTS log_activity_tasks ON public.tasks;
DROP TRIGGER IF EXISTS log_activity_deliveries ON public.deliveries;
DROP TRIGGER IF EXISTS log_activity_invoices ON public.invoices;
DROP TRIGGER IF EXISTS log_activity_contracts ON public.contracts;
DROP TRIGGER IF EXISTS log_activity_meetings ON public.meetings;

CREATE TRIGGER log_activity_projects AFTER INSERT OR UPDATE OR DELETE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER log_activity_tasks AFTER INSERT OR UPDATE OR DELETE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER log_activity_deliveries AFTER INSERT OR UPDATE OR DELETE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER log_activity_invoices AFTER INSERT OR UPDATE OR DELETE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER log_activity_contracts AFTER INSERT OR UPDATE OR DELETE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER log_activity_meetings AFTER INSERT OR UPDATE OR DELETE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.log_activity();

-- updated_at triggers
DROP TRIGGER IF EXISTS update_updated_at_projects ON public.projects;
DROP TRIGGER IF EXISTS update_updated_at_tasks ON public.tasks;
DROP TRIGGER IF EXISTS update_updated_at_deliveries ON public.deliveries;
DROP TRIGGER IF EXISTS update_updated_at_invoices ON public.invoices;
DROP TRIGGER IF EXISTS update_updated_at_contracts ON public.contracts;
DROP TRIGGER IF EXISTS update_updated_at_sessions ON public.sessions;
DROP TRIGGER IF EXISTS update_updated_at_organisations ON public.organisations;
DROP TRIGGER IF EXISTS update_updated_at_profiles ON public.profiles;
DROP TRIGGER IF EXISTS update_updated_at_notes ON public.notes;
DROP TRIGGER IF EXISTS update_updated_at_forms ON public.forms;
DROP TRIGGER IF EXISTS update_updated_at_knowledge_articles ON public.knowledge_articles;
DROP TRIGGER IF EXISTS update_updated_at_ai_conversations ON public.ai_conversations;

CREATE TRIGGER update_updated_at_projects BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_updated_at_tasks BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_updated_at_deliveries BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_updated_at_invoices BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_updated_at_contracts BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_updated_at_sessions BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_updated_at_organisations BEFORE UPDATE ON public.organisations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_updated_at_notes BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_updated_at_forms BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_updated_at_knowledge_articles BEFORE UPDATE ON public.knowledge_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_updated_at_ai_conversations BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
