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
import { useDelivery, useUpdateDelivery, useDeleteDelivery, useAdvanceDeliveryStatus, useSessions, useCreateSession, useAgendaItems, useCreateAgendaItem, useUpdateAgendaItem, useDeleteAgendaItem, type Session } from '@/hooks/useDeliveries';
import { useServices } from '@/hooks/useServices';
import { useFormResponses, useForms } from '@/hooks/useForms';
import { ArrowLeft, Plus, Trash2, Clock, ChevronUp, ChevronDown, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusBadgeClasses } from '@/lib/status-colors';
import { DocumentsTab } from '@/components/projects/DocumentsTab';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const AGENDA_TYPES = ['intro', 'activity', 'break', 'debrief', 'energiser'] as const;
const TYPE_COLORS: Record<string, string> = {
  intro: 'bg-success/15 text-success border-success/30',
  activity: 'bg-info/15 text-info border-info/30',
  break: 'bg-warning/15 text-warning border-warning/30',
  debrief: 'bg-purple/15 text-purple border-purple/30',
  energiser: 'bg-pink/15 text-pink border-pink/30',
};
const DELIVERY_STATUSES = ['planning', 'scheduled', 'confirmed', 'in_progress', 'materials_sent', 'delivered', 'follow_up', 'feedback_collected', 'complete', 'cancelled'];

export default function WorkshopDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: delivery, isLoading } = useDelivery(id);
  const { data: sessions } = useSessions(id);
  const advanceStatus = useAdvanceDeliveryStatus();
  const deleteDelivery = useDeleteDelivery();
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <AppShell><Skeleton className="h-8 w-64" /></AppShell>;
  if (!delivery) return <AppShell><p className="text-muted-foreground">Workshop not found.</p></AppShell>;

  const handleAdvance = async (newStatus: string) => {
    try {
      await advanceStatus.mutateAsync({ deliveryId: id!, newStatus });
      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this workshop? This cannot be undone.')) return;
    try {
      await deleteDelivery.mutateAsync(id!);
      toast.success('Workshop deleted');
      navigate('/workshops');
    } catch (err: any) { toast.error(err.message); }
  };

  const nextStatuses: Record<string, string[]> = {
    planning: ['scheduled'],
    scheduled: ['confirmed', 'in_progress'],
    confirmed: ['in_progress'],
    in_progress: ['delivered'],
    delivered: ['follow_up', 'complete'],
    follow_up: ['feedback_collected', 'complete'],
    feedback_collected: ['complete'],
  };
  const available = nextStatuses[delivery.status] || [];

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/workshops" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-page-title">{delivery.title}</h1>
          <Badge className={getStatusBadgeClasses(delivery.status, 'delivery')}>{delivery.status.replace(/_/g, ' ')}</Badge>
          {delivery.neuro_phase && <Badge className={getStatusBadgeClasses(delivery.neuro_phase, 'neuro_phase')}>{delivery.neuro_phase}</Badge>}
          {delivery.kirkpatrick_level && <Badge variant="outline">L{delivery.kirkpatrick_level}</Badge>}
          {available.map((s) => (
            <Button key={s} size="sm" variant="outline" onClick={() => handleAdvance(s)} disabled={advanceStatus.isPending}>
              → {s.replace(/_/g, ' ')}
            </Button>
          ))}
          <div className="ml-auto flex gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={handleDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions ({sessions?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-3">
            <Card>
              <CardContent className="pt-6 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-caption">Client</span><p>{(delivery as any).organisations?.name ?? '—'}</p></div>
                <div><span className="text-muted-foreground text-caption">Project</span><p><Link to={`/projects/${delivery.project_id}`} className="text-primary hover:underline">{(delivery as any).projects?.name}</Link></p></div>
                <div><span className="text-muted-foreground text-caption">Service</span><p>{(delivery as any).services?.name ?? '—'}</p></div>
                <div><span className="text-muted-foreground text-caption">Date</span><p>{delivery.delivery_date ?? '—'}</p></div>
                <div><span className="text-muted-foreground text-caption">Duration</span><p>{delivery.duration_minutes ? `${delivery.duration_minutes}m` : '—'}</p></div>
                <div><span className="text-muted-foreground text-caption">Delegates</span><p>{delivery.delegate_count ?? '—'}</p></div>
                <div><span className="text-muted-foreground text-caption">Location</span><p>{delivery.location ?? '—'}</p></div>
                <div><span className="text-muted-foreground text-caption">Satisfaction</span><p>{delivery.satisfaction_score ? `${delivery.satisfaction_score}/10` : '—'}</p></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="mt-3 space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setSessionDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Session</Button>
            </div>
            {!sessions?.length ? (
              <p className="text-muted-foreground text-center py-4">No sessions yet.</p>
            ) : (
              <div className="space-y-1.5">
                {sessions.map((s) => (
                  <div key={s.id} className="bg-card rounded-lg border p-3">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setSelectedSession(s.id === selectedSession ? null : s.id)}>
                      <div>
                        <p className="font-medium">{s.title}</p>
                        <p className="text-caption text-muted-foreground">{s.session_type} · {s.duration_minutes}m</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{s.content_status ?? 'draft'}</Badge>
                    </div>
                    {selectedSession === s.id && (
                      <div className="mt-3 border-t pt-3">
                        <AgendaBuilder sessionId={s.id} targetMinutes={s.duration_minutes || 90} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="feedback" className="mt-3">
            <FeedbackTab deliveryId={id!} feedbackFormId={delivery.feedback_form_id} satisfactionScore={delivery.satisfaction_score} />
          </TabsContent>

          <TabsContent value="documents" className="mt-3">
            <DocumentsTab projectId={delivery.project_id} />
          </TabsContent>
        </Tabs>
      </div>

      <AddSessionDialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen} deliveryId={id!} projectId={delivery.project_id} />
      <EditDeliveryDialog open={editOpen} onOpenChange={setEditOpen} delivery={delivery} />
    </AppShell>
  );
}

function EditDeliveryDialog({ open, onOpenChange, delivery }: { open: boolean; onOpenChange: (o: boolean) => void; delivery: any }) {
  const updateDelivery = useUpdateDelivery();
  const { data: services } = useServices();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await updateDelivery.mutateAsync({
        id: delivery.id,
        title: fd.get('title') as string,
        status: fd.get('status') as string,
        delivery_date: (fd.get('delivery_date') as string) || null,
        duration_minutes: Number(fd.get('duration_minutes')) || null,
        delegate_count: Number(fd.get('delegate_count')) || null,
        location: (fd.get('location') as string) || null,
        neuro_phase: (fd.get('neuro_phase') as string) || null,
        notes: (fd.get('notes') as string) || null,
        service_id: (fd.get('service_id') as string) || null,
      });
      toast.success('Workshop updated');
      onOpenChange(false);
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Workshop</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Title *</Label><Input name="title" required defaultValue={delivery.title} /></div>
          <div><Label>Status</Label>
            <Select name="status" defaultValue={delivery.status}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DELIVERY_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Service</Label>
            <Select name="service_id" defaultValue={delivery.service_id ?? ''}>
              <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent>{services?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date</Label><Input name="delivery_date" type="date" defaultValue={delivery.delivery_date ?? ''} /></div>
            <div><Label>Duration (mins)</Label><Input name="duration_minutes" type="number" defaultValue={delivery.duration_minutes ?? ''} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Delegates</Label><Input name="delegate_count" type="number" defaultValue={delivery.delegate_count ?? ''} /></div>
            <div><Label>Neuro Phase</Label><Input name="neuro_phase" defaultValue={delivery.neuro_phase ?? ''} /></div>
          </div>
          <div><Label>Location</Label><Input name="location" defaultValue={delivery.location ?? ''} /></div>
          <div><Label>Notes</Label><Textarea name="notes" defaultValue={delivery.notes ?? ''} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={updateDelivery.isPending}>{updateDelivery.isPending ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AgendaBuilder({ sessionId, targetMinutes }: { sessionId: string; targetMinutes: number }) {
  const { data: items } = useAgendaItems(sessionId);
  const createItem = useCreateAgendaItem();
  const updateItem = useUpdateAgendaItem();
  const deleteItem = useDeleteAgendaItem();
  const [addOpen, setAddOpen] = useState(false);
  const totalMinutes = items?.reduce((sum, i) => sum + i.duration_minutes, 0) ?? 0;
  const isOver = totalMinutes > targetMinutes;

  const moveItem = async (idx: number, direction: 'up' | 'down') => {
    if (!items) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    await updateItem.mutateAsync({ id: items[idx].id, position: items[swapIdx].position });
    await updateItem.mutateAsync({ id: items[swapIdx].id, position: items[idx].position });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 text-caption font-medium ${isOver ? 'text-destructive' : 'text-muted-foreground'}`}>
          <Clock className="h-3.5 w-3.5" />
          {totalMinutes} / {targetMinutes} minutes planned
        </div>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Add Block</Button>
      </div>
      {items?.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-2 bg-background rounded border p-3">
          <div className="flex flex-col shrink-0">
            <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronUp className="h-3 w-3" /></button>
            <button onClick={() => moveItem(idx, 'down')} disabled={idx === (items?.length ?? 0) - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronDown className="h-3 w-3" /></button>
          </div>
          <Badge className={`text-xs capitalize shrink-0 ${TYPE_COLORS[item.type] || ''}`}>{item.type}</Badge>
          <span className="text-sm flex-1 truncate">{item.title}</span>
          {item.method && <span className="text-caption text-muted-foreground shrink-0">{item.method}</span>}
          <span className="text-caption text-muted-foreground shrink-0 font-mono">{item.duration_minutes}m</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => deleteItem.mutate(item.id)}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ))}
      {addOpen && <AddAgendaItemInline sessionId={sessionId} position={(items?.length ?? 0) + 1} onDone={() => setAddOpen(false)} />}
    </div>
  );
}

function AddAgendaItemInline({ sessionId, position, onDone }: { sessionId: string; position: number; onDone: () => void }) {
  const createItem = useCreateAgendaItem();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('activity');
  const [duration, setDuration] = useState('15');
  const [method, setMethod] = useState('');

  const submit = async () => {
    if (!title) return;
    await createItem.mutateAsync({ session_id: sessionId, title, type, duration_minutes: Number(duration), position, method: method || null });
    onDone();
  };

  return (
    <div className="flex items-center gap-2 bg-background rounded border p-3 flex-wrap">
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
        <SelectContent>{AGENDA_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
      </Select>
      <Input className="h-8 flex-1 min-w-[120px]" placeholder="Block title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input className="h-8 w-20" placeholder="Method" value={method} onChange={(e) => setMethod(e.target.value)} />
      <Input className="h-8 w-16" type="number" placeholder="mins" value={duration} onChange={(e) => setDuration(e.target.value)} />
      <Button size="sm" className="h-8" onClick={submit} disabled={createItem.isPending}>Add</Button>
      <Button size="sm" variant="ghost" className="h-8" onClick={onDone}>Cancel</Button>
    </div>
  );
}

function FeedbackTab({ deliveryId, feedbackFormId, satisfactionScore }: { deliveryId: string; feedbackFormId: string | null; satisfactionScore: number | null }) {
  const { data: responses } = useQuery({
    queryKey: ['form_responses', feedbackFormId],
    enabled: !!feedbackFormId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('form_id', feedbackFormId!)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!feedbackFormId) return <p className="text-muted-foreground text-center py-4">No feedback form linked to this workshop.</p>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="pt-4"><p className="text-caption text-muted-foreground">Satisfaction Score</p><p className="text-section-title">{satisfactionScore ? `${satisfactionScore}/10` : '—'}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-caption text-muted-foreground">Responses</p><p className="text-section-title">{responses?.length ?? 0}</p></CardContent></Card>
      </div>
      <Card><CardContent className="pt-4"><p className="text-sm font-medium mb-2">Public Form Link</p><code className="text-mono text-xs bg-background rounded border p-3 block">{window.location.origin}/form/{feedbackFormId}</code></CardContent></Card>
      {responses?.length ? (
        <div className="space-y-1.5">
          {responses.map((r) => (
            <Card key={r.id}><CardContent className="pt-4">
              <p className="text-caption text-muted-foreground mb-2">{new Date(r.submitted_at!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              <div className="space-y-1.5">
                {Object.entries(typeof r.data === 'string' ? JSON.parse(r.data) : r.data).map(([key, value]) => (
                  <div key={key} className="flex justify-between"><span className="text-sm text-muted-foreground">{key}</span><span className="text-sm font-medium">{String(value)}</span></div>
                ))}
              </div>
            </CardContent></Card>
          ))}
        </div>
      ) : <p className="text-muted-foreground text-center py-3">No responses yet.</p>}
    </div>
  );
}

function AddSessionDialog({ open, onOpenChange, deliveryId, projectId }: { open: boolean; onOpenChange: (o: boolean) => void; deliveryId: string; projectId: string }) {
  const createSession = useCreateSession();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('90');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSession.mutateAsync({ title, delivery_id: deliveryId, project_id: projectId, duration_minutes: Number(duration) });
      toast.success('Session added');
      onOpenChange(false);
      setTitle(''); setDuration('90');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Session</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div><Label>Duration (mins)</Label><Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createSession.isPending}>Add</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
