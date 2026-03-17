import { useParams, Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProject, useAdvanceProjectStatus } from '@/hooks/useProjects';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useTasks } from '@/hooks/useTasks';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusBadgeClasses } from '@/lib/status-colors';
import { toast } from 'sonner';
import { BillingTab } from '@/components/projects/BillingTab';
import { FormsTab } from '@/components/projects/FormsTab';
import { NotesTab } from '@/components/projects/NotesTab';
import { DocumentsTab } from '@/components/projects/DocumentsTab';
import { UpdatesTab } from '@/components/projects/UpdatesTab';

const STATUS_ORDER = ['contracting', 'project_planning', 'session_planning', 'content_review', 'delivery', 'feedback_analytics', 'closed'];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id);
  const { data: deliveries } = useDeliveries(id);
  const { data: tasks } = useTasks({ projectId: id });
  const advanceStatus = useAdvanceProjectStatus();

  if (isLoading) return <AppShell><Skeleton className="h-8 w-64" /></AppShell>;
  if (!project) return <AppShell><p className="text-text-2">Project not found.</p></AppShell>;

  const currentIdx = STATUS_ORDER.indexOf(project.status);
  const nextStatus = currentIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIdx + 1] : null;

  const handleAdvance = async () => {
    if (!nextStatus || !id) return;
    try {
      await advanceStatus.mutateAsync({ projectId: id, newStatus: nextStatus });
      toast.success(`Project moved to ${nextStatus.replace(/_/g, ' ')}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <AppShell>
      <div className="space-y-lg">
        <div className="flex items-center gap-md">
          <Link to="/projects" className="text-text-3 hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-page-title">{project.name}</h1>
          <Badge className={getStatusBadgeClasses(project.status, 'project')}>{project.status.replace(/_/g, ' ')}</Badge>
          {nextStatus && project.status !== 'closed' && (
            <Button size="sm" variant="outline" onClick={handleAdvance} disabled={advanceStatus.isPending}>
              Advance to {nextStatus.replace(/_/g, ' ')}
            </Button>
          )}
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workshops">Workshops ({deliveries?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({tasks?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="updates">Updates</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-md">
            <Card>
              <CardContent className="pt-6 grid grid-cols-2 gap-md text-body">
                <div><span className="text-text-3 text-caption">Client</span><p>{(project as any).organisations?.name ?? '—'}</p></div>
                <div><span className="text-text-3 text-caption">Budget</span><p>{project.budget ? `£${Number(project.budget).toLocaleString()}` : '—'}</p></div>
                <div><span className="text-text-3 text-caption">Start Date</span><p>{project.start_date ?? '—'}</p></div>
                <div><span className="text-text-3 text-caption">End Date</span><p>{project.end_date ?? '—'}</p></div>
                <div><span className="text-text-3 text-caption">External Ref</span><p>{project.external_ref ?? '—'}</p></div>
                <div><span className="text-text-3 text-caption">Neuro Phase</span><p>{project.intended_neuro_phase ?? '—'}</p></div>
                <div className="col-span-2"><span className="text-text-3 text-caption">Notes</span><p className="whitespace-pre-wrap">{project.notes ?? '—'}</p></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workshops" className="mt-md">
            {!deliveries?.length ? <p className="text-text-2 text-center py-lg">No workshops yet.</p> : (
              <div className="space-y-xs">
                {deliveries.map((d) => (
                  <Link key={d.id} to={`/workshops/${d.id}`} className="block bg-surface rounded-md border p-md hover:border-primary transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{d.title}</p>
                      <Badge className={getStatusBadgeClasses(d.status, 'delivery')}>{d.status}</Badge>
                    </div>
                    <p className="text-caption text-text-3 mt-1">{d.delivery_date ?? 'No date'} · {(d as any).services?.name ?? 'No service'}</p>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="mt-md">
            {!tasks?.length ? <p className="text-text-2 text-center py-lg">No tasks yet.</p> : (
              <div className="space-y-xs">
                {tasks.map((t) => (
                  <div key={t.id} className="bg-surface rounded-md border p-md flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t.title}</p>
                      <p className="text-caption text-text-3">{t.due_date ?? 'No due date'}</p>
                    </div>
                    <Badge className={getStatusBadgeClasses(t.status, 'task')}>{t.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="billing" className="mt-md">
            <BillingTab projectId={id!} budget={project.budget ? Number(project.budget) : null} />
          </TabsContent>

          <TabsContent value="forms" className="mt-md">
            <FormsTab projectId={id!} />
          </TabsContent>

          <TabsContent value="notes" className="mt-md">
            <NotesTab projectId={id!} />
          </TabsContent>

          <TabsContent value="documents" className="mt-md">
            <DocumentsTab projectId={id!} />
          </TabsContent>

          <TabsContent value="updates" className="mt-md">
            <UpdatesTab projectId={id!} projectName={project.name} projectStatus={project.status} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
