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
import { useDeliveries, useCreateDelivery } from '@/hooks/useDeliveries';
import { useProjects } from '@/hooks/useProjects';
import { useOrganisations } from '@/hooks/useOrganisations';
import { useServices } from '@/hooks/useServices';
import { Plus, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusBadgeClasses } from '@/lib/status-colors';

const DELIVERY_STATUSES = ['planning', 'scheduled', 'in_progress', 'delivered', 'follow_up', 'complete', 'cancelled'];

export default function Workshops() {
  const { data: deliveries, isLoading } = useDeliveries();
  const [view, setView] = useState<'table' | 'board'>('table');
  const [dialogOpen, setDialogOpen] = useState(false);

  const boardGroups = DELIVERY_STATUSES.map((s) => ({
    status: s,
    items: deliveries?.filter((d) => d.status === s) ?? [],
  }));

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Workshops</h1>
          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="table" className="text-xs px-2">Table</TabsTrigger>
                <TabsTrigger value="board" className="text-xs px-2">Board</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => setDialogOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> New Workshop</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !deliveries?.length ? (
          <div className="bg-card rounded-xl border p-6 text-center space-y-3">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground" strokeWidth={1.25} />
            <p className="text-sm text-muted-foreground">No workshops yet.</p>
            <Button onClick={() => setDialogOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> New Workshop</Button>
          </div>
        ) : view === 'table' ? (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell><Link to={`/workshops/${d.id}`} className="font-medium text-primary hover:underline">{d.title}</Link></TableCell>
                    <TableCell>{(d as any).organisations?.name ?? '—'}</TableCell>
                    <TableCell>{(d as any).services?.name ?? '—'}</TableCell>
                    <TableCell>{d.delivery_date ?? '—'}</TableCell>
                    <TableCell><Badge className={getStatusBadgeClasses(d.status, 'delivery')}>{d.status.replace('_', ' ')}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {boardGroups.map((g) => {
              const DELIVERY_COL_COLORS: Record<string, { accent: string; dot: string }> = {
                planning: { accent: 'border-t-muted-foreground', dot: 'bg-muted-foreground' },
                scheduled: { accent: 'border-t-warning', dot: 'bg-warning' },
                in_progress: { accent: 'border-t-[hsl(var(--info))]', dot: 'bg-[hsl(var(--info))]' },
                delivered: { accent: 'border-t-[hsl(var(--purple))]', dot: 'bg-[hsl(var(--purple))]' },
                follow_up: { accent: 'border-t-[hsl(var(--cyan))]', dot: 'bg-[hsl(var(--cyan))]' },
                complete: { accent: 'border-t-success', dot: 'bg-success' },
                cancelled: { accent: 'border-t-destructive', dot: 'bg-destructive' },
              };
              const colColors = DELIVERY_COL_COLORS[g.status] ?? { accent: 'border-t-muted-foreground', dot: 'bg-muted-foreground' };
              return (
                <div key={g.status} className="min-w-[260px] w-[260px] shrink-0">
                  <div className={`bg-card rounded-xl border border-t-[3px] ${colColors.accent} shadow-sm`}>
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${colColors.dot}`} />
                      <span className="text-xs font-semibold uppercase tracking-wide capitalize">{g.status.replace(/_/g, ' ')}</span>
                      <span className="ml-auto text-xs text-muted-foreground font-medium bg-muted rounded-full px-2 py-0.5">{g.items.length}</span>
                    </div>
                    <div className="px-2 pb-2 space-y-1.5">
                      {g.items.map((d) => (
                        <Link key={d.id} to={`/workshops/${d.id}`} className="block bg-background rounded-lg border p-3 hover:shadow-md transition-all duration-200 cursor-pointer">
                          <p className="text-sm font-medium truncate">{d.title}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{(d as any).organisations?.name} · {d.delivery_date ?? 'TBD'}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateDeliveryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </AppShell>
  );
}

function CreateDeliveryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const createDelivery = useCreateDelivery();
  const { data: projects } = useProjects();
  const { data: services } = useServices();
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');

  const selectedProject = projects?.find((p) => p.id === projectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await createDelivery.mutateAsync({
        title, project_id: projectId, organisation_id: selectedProject.organisation_id,
        service_id: serviceId || null, delivery_date: date || null,
      });
      toast.success('Workshop created');
      onOpenChange(false);
      setTitle(''); setProjectId(''); setServiceId(''); setDate('');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Workshop</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div><Label>Project *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>{projects?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Service</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent>{services?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Delivery Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createDelivery.isPending || !projectId}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
