import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects, useCreateProject } from '@/hooks/useProjects';
import { useOrganisations } from '@/hooks/useOrganisations';
import { Plus, FolderKanban } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusBadgeClasses } from '@/lib/status-colors';

const PROJECT_STATUSES = ['contracting', 'project_planning', 'session_planning', 'content_review', 'delivery', 'feedback_analytics', 'closed'];

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const [view, setView] = useState<'table' | 'board'>('table');
  const [dialogOpen, setDialogOpen] = useState(false);

  const boardGroups = PROJECT_STATUSES.map((s) => ({
    status: s,
    items: projects?.filter((p) => p.status === s) ?? [],
  }));

  return (
    <AppShell>
      <div className="space-y-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Projects</h1>
          <div className="flex items-center gap-sm">
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="table" className="text-xs px-2">Table</TabsTrigger>
                <TabsTrigger value="board" className="text-xs px-2">Board</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => setDialogOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> New Project</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-sm">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !projects?.length ? (
          <div className="bg-surface rounded-lg border p-xl text-center space-y-md">
            <FolderKanban className="h-12 w-12 mx-auto text-text-3" strokeWidth={1.25} />
            <p className="text-body text-text-2">No projects yet.</p>
            <Button onClick={() => setDialogOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> New Project</Button>
          </div>
        ) : view === 'table' ? (
          <div className="rounded-lg border bg-surface overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><Link to={`/projects/${p.id}`} className="font-medium text-primary hover:underline">{p.name}</Link></TableCell>
                    <TableCell>{(p as any).organisations?.name ?? '—'}</TableCell>
                    <TableCell><Badge className={getStatusBadgeClasses(p.status, 'project')}>{p.status.replace('_', ' ')}</Badge></TableCell>
                    <TableCell>{p.budget ? `£${Number(p.budget).toLocaleString()}` : '—'}</TableCell>
                    <TableCell>{p.start_date ?? '—'}</TableCell>
                    <TableCell>{p.end_date ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex gap-md overflow-x-auto pb-md">
            {boardGroups.map((g) => (
              <div key={g.status} className="min-w-[240px] w-[240px] shrink-0">
                <div className="flex items-center gap-2 mb-sm">
                  <Badge variant="outline" className="capitalize text-xs">{g.status.replace('_', ' ')}</Badge>
                  <span className="text-caption text-text-3">{g.items.length}</span>
                </div>
                <div className="space-y-xs">
                  {g.items.map((p) => (
                    <Link key={p.id} to={`/projects/${p.id}`} className="block bg-surface rounded-md border p-sm hover:border-primary transition-colors">
                      <p className="text-body font-medium truncate">{p.name}</p>
                      <p className="text-caption text-text-3 truncate">{(p as any).organisations?.name}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </AppShell>
  );
}

function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const createProject = useCreateProject();
  const { data: orgs } = useOrganisations();
  const [name, setName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [budget, setBudget] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProject.mutateAsync({ name, organisation_id: orgId, budget: budget ? Number(budget) : null });
      toast.success('Project created');
      onOpenChange(false);
      setName(''); setOrgId(''); setBudget('');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-md">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div><Label>Client *</Label>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>{orgs?.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Budget (£)</Label><Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
          <div className="flex justify-end gap-sm">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createProject.isPending || !orgId}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
