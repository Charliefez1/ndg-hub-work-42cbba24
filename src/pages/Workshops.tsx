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
      <div className="space-y-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Workshops</h1>
          <div className="flex items-center gap-sm">
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
          <div className="space-y-sm">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !deliveries?.length ? (
          <div className="bg-surface rounded-lg border p-xl text-center space-y-md">
            <Briefcase className="h-12 w-12 mx-auto text-text-3" strokeWidth={1.25} />
            <p className="text-body text-text-2">No workshops yet.</p>
            <Button onClick={() => setDialogOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> New Workshop</Button>
          </div>
        ) : view === 'table' ? (
          <div className="rounded-lg border bg-surface overflow-hidden">
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
          <div className="flex gap-md overflow-x-auto pb-md">
            {boardGroups.map((g) => (
              <div key={g.status} className="min-w-[240px] w-[240px] shrink-0">
                <div className="flex items-center gap-2 mb-sm">
                  <Badge variant="outline" className="capitalize text-xs">{g.status.replace('_', ' ')}</Badge>
                  <span className="text-caption text-text-3">{g.items.length}</span>
                </div>
                <div className="space-y-xs">
                  {g.items.map((d) => (
                    <Link key={d.id} to={`/workshops/${d.id}`} className="block bg-surface rounded-md border p-sm hover:border-primary transition-colors">
                      <p className="text-body font-medium truncate">{d.title}</p>
                      <p className="text-caption text-text-3 truncate">{(d as any).organisations?.name} · {d.delivery_date ?? 'TBD'}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
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
        <form onSubmit={handleSubmit} className="space-y-md">
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
          <div className="flex justify-end gap-sm">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createDelivery.isPending || !projectId}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
