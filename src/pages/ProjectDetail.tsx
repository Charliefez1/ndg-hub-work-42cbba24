import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProject, useUpdateProject, useDeleteProject, useAdvanceProjectStatus } from '@/hooks/useProjects';
import { useOrganisations } from '@/hooks/useOrganisations';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useTasks } from '@/hooks/useTasks';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusBadgeClasses } from '@/lib/status-colors';
import { toast } from 'sonner';
import { BillingTab } from '@/components/projects/BillingTab';
import { FormsTab } from '@/components/projects/FormsTab';
import { NotesTab } from '@/components/projects/NotesTab';
import { DocumentsTab } from '@/components/projects/DocumentsTab';
import { UpdatesTab } from '@/components/projects/UpdatesTab';

const STATUS_ORDER = ['contracting', 'project_planning', 'session_planning', 'content_development', 'content_review', 'ready', 'delivery', 'feedback_analytics', 'closed'];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id);
  const { data: deliveries } = useDeliveries(id);
  const { data: tasks } = useTasks({ projectId: id });
  const advanceStatus = useAdvanceProjectStatus();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <AppShell><Skeleton className="h-8 w-64" /></AppShell>;
  if (!project) return <AppShell><p className="text-muted-foreground">Project not found.</p></AppShell>;

  const currentIdx = STATUS_ORDER.indexOf(project.status);
  const nextStatus = currentIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIdx + 1] : null;

  const handleAdvance = async () => {
    if (!nextStatus || !id) return;
    try {
      await advanceStatus.mutateAsync({ projectId: id, newStatus: nextStatus });
      toast.success(`Project moved to ${nextStatus.replace(/_/g, ' ')}`);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      await deleteProject.mutateAsync(id!);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/projects" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-page-title">{project.name}</h1>
          <Badge className={getStatusBadgeClasses(project.status, 'project')}>{project.status.replace(/_/g, ' ')}</Badge>
          {nextStatus && project.status !== 'closed' && (
            <Button size="sm" variant="outline" onClick={handleAdvance} disabled={advanceStatus.isPending}>
              Advance to {nextStatus.replace(/_/g, ' ')}
            </Button>
          )}
          <div className="ml-auto flex gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={handleDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
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

          <TabsContent value="overview" className="mt-3">
            <Card>
              <CardContent className="pt-6 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-caption">Client</span><p>{(project as any).organisations?.name ?? '—'}</p></div>
                <div><span className="text-muted-foreground text-caption">Budget</span><p>{project.budget ? `£${Number(project.budget).toLocaleString()}` : '—'}</p></div>
                <div><span className="text-muted-foreground text-caption">Start Date</span><p>{project.start_date ?? '—'}</p></div>
                <div><span className="text-muted-foreground text-caption">End Date</span><p>{project.end_date ?? '—'}</p></div>
                <div><span className="text-muted-foreground text-caption">External Ref</span><p>{project.external_ref ?? '—'}</p></div>
                <div><span className="text-muted-foreground text-caption">Neuro Phase</span><p>{project.intended_neuro_phase ?? '—'}</p></div>
                <div className="col-span-2"><span className="text-muted-foreground text-caption">Notes</span><p className="whitespace-pre-wrap">{project.notes ?? '—'}</p></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workshops" className="mt-3">
            {!deliveries?.length ? <p className="text-muted-foreground text-center py-4">No workshops yet.</p> : (
              <div className="space-y-1.5">
                {deliveries.map((d) => (
                  <Link key={d.id} to={`/workshops/${d.id}`} className="block bg-card rounded-lg border p-3 hover:border-primary transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{d.title}</p>
                      <Badge className={getStatusBadgeClasses(d.status, 'delivery')}>{d.status}</Badge>
                    </div>
                    <p className="text-caption text-muted-foreground mt-1">{d.delivery_date ?? 'No date'} · {(d as any).services?.name ?? 'No service'}</p>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="mt-3">
            {!tasks?.length ? <p className="text-muted-foreground text-center py-4">No tasks yet.</p> : (
              <div className="space-y-1.5">
                {tasks.map((t) => (
                  <div key={t.id} className="bg-card rounded-lg border p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t.title}</p>
                      <p className="text-caption text-muted-foreground">{t.due_date ?? 'No due date'}</p>
                    </div>
                    <Badge className={getStatusBadgeClasses(t.status, 'task')}>{t.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="billing" className="mt-3">
            <BillingTab projectId={id!} budget={project.budget ? Number(project.budget) : null} />
          </TabsContent>
          <TabsContent value="forms" className="mt-3">
            <FormsTab projectId={id!} />
          </TabsContent>
          <TabsContent value="notes" className="mt-3">
            <NotesTab projectId={id!} />
          </TabsContent>
          <TabsContent value="documents" className="mt-3">
            <DocumentsTab projectId={id!} />
          </TabsContent>
          <TabsContent value="updates" className="mt-3">
            <UpdatesTab projectId={id!} projectName={project.name} projectStatus={project.status} />
          </TabsContent>
        </Tabs>
      </div>

      <EditProjectDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
    </AppShell>
  );
}

function EditProjectDialog({ open, onOpenChange, project }: { open: boolean; onOpenChange: (o: boolean) => void; project: any }) {
  const updateProject = useUpdateProject();
  const { data: orgs } = useOrganisations();
  const [name, setName] = useState(project.name);
  const [orgId, setOrgId] = useState(project.organisation_id);
  const [status, setStatus] = useState(project.status);
  const [budget, setBudget] = useState(project.budget?.toString() ?? '');
  const [startDate, setStartDate] = useState(project.start_date ?? '');
  const [endDate, setEndDate] = useState(project.end_date ?? '');
  const [externalRef, setExternalRef] = useState(project.external_ref ?? '');
  const [neuroPhase, setNeuroPhase] = useState(project.intended_neuro_phase ?? '');
  const [notes, setNotes] = useState(project.notes ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProject.mutateAsync({
        id: project.id,
        name, organisation_id: orgId, status,
        budget: budget ? Number(budget) : null,
        start_date: startDate || null, end_date: endDate || null,
        external_ref: externalRef || null,
        intended_neuro_phase: neuroPhase || null,
        notes: notes || null,
      });
      toast.success('Project updated');
      onOpenChange(false);
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div><Label>Client</Label>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{orgs?.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_ORDER.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Budget (£)</Label><Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><Label>End Date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          </div>
          <div><Label>External Ref</Label><Input value={externalRef} onChange={(e) => setExternalRef(e.target.value)} /></div>
          <div><Label>Neuro Phase</Label><Input value={neuroPhase} onChange={(e) => setNeuroPhase(e.target.value)} /></div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={updateProject.isPending}>{updateProject.isPending ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
