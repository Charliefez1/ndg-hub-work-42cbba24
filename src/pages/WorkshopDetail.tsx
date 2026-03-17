import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDelivery, useAdvanceDeliveryStatus, useSessions, useCreateSession, useAgendaItems, useCreateAgendaItem, useUpdateAgendaItem, useDeleteAgendaItem, type Session } from '@/hooks/useDeliveries';
import { useFormResponses, useForms } from '@/hooks/useForms';
import { ArrowLeft, Plus, Trash2, GripVertical, Clock, ChevronUp, ChevronDown } from 'lucide-react';
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

export default function WorkshopDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: delivery, isLoading } = useDelivery(id);
  const { data: sessions } = useSessions(id);
  const advanceStatus = useAdvanceDeliveryStatus();
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  if (isLoading) return <AppShell><Skeleton className="h-8 w-64" /></AppShell>;
  if (!delivery) return <AppShell><p className="text-text-2">Workshop not found.</p></AppShell>;

  const handleAdvance = async (newStatus: string) => {
    try {
      await advanceStatus.mutateAsync({ deliveryId: id!, newStatus });
      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
    } catch (err: any) { toast.error(err.message); }
  };

  const nextStatuses: Record<string, string[]> = {
    planning: ['scheduled'],
    scheduled: ['in_progress'],
    in_progress: ['delivered'],
    delivered: ['follow_up', 'complete'],
    follow_up: ['complete'],
  };
  const available = nextStatuses[delivery.status] || [];

  return (
    <AppShell>
      <div className="space-y-lg">
        <div className="flex items-center gap-md flex-wrap">
          <Link to="/workshops" className="text-text-3 hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-page-title">{delivery.title}</h1>
          <Badge className={getStatusBadgeClasses(delivery.status, 'delivery')}>{delivery.status.replace(/_/g, ' ')}</Badge>
          {delivery.neuro_phase && (
            <Badge className={getStatusBadgeClasses(delivery.neuro_phase, 'neuro_phase')}>{delivery.neuro_phase}</Badge>
          )}
          {delivery.kirkpatrick_level && (
            <Badge variant="outline">L{delivery.kirkpatrick_level}</Badge>
          )}
          {available.map((s) => (
            <Button key={s} size="sm" variant="outline" onClick={() => handleAdvance(s)} disabled={advanceStatus.isPending}>
              → {s.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions ({sessions?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-md">
            <Card>
              <CardContent className="pt-6 grid grid-cols-2 gap-md text-body">
                <div><span className="text-text-3 text-caption">Client</span><p>{(delivery as any).organisations?.name ?? '—'}</p></div>
                <div><span className="text-text-3 text-caption">Project</span><p><Link to={`/projects/${delivery.project_id}`} className="text-primary hover:underline">{(delivery as any).projects?.name}</Link></p></div>
                <div><span className="text-text-3 text-caption">Service</span><p>{(delivery as any).services?.name ?? '—'}</p></div>
                <div><span className="text-text-3 text-caption">Date</span><p>{delivery.delivery_date ?? '—'}</p></div>
                <div><span className="text-text-3 text-caption">Duration</span><p>{delivery.duration_minutes ? `${delivery.duration_minutes}m` : '—'}</p></div>
                <div><span className="text-text-3 text-caption">Delegates</span><p>{delivery.delegate_count ?? '—'}</p></div>
                <div><span className="text-text-3 text-caption">Location</span><p>{delivery.location ?? '—'}</p></div>
                <div><span className="text-text-3 text-caption">Satisfaction</span><p>{delivery.satisfaction_score ? `${delivery.satisfaction_score}/10` : '—'}</p></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="mt-md space-y-md">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setSessionDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Session</Button>
            </div>
            {!sessions?.length ? (
              <p className="text-text-2 text-center py-lg">No sessions yet.</p>
            ) : (
              <div className="space-y-xs">
                {sessions.map((s) => (
                  <div key={s.id} className="bg-surface rounded-md border p-md">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setSelectedSession(s.id === selectedSession ? null : s.id)}
                    >
                      <div>
                        <p className="font-medium">{s.title}</p>
                        <p className="text-caption text-text-3">{s.session_type} · {s.duration_minutes}m</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{s.content_status ?? 'draft'}</Badge>
                    </div>
                    {selectedSession === s.id && (
                      <div className="mt-md border-t pt-md">
                        <AgendaBuilder sessionId={s.id} targetMinutes={s.duration_minutes || 90} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="feedback" className="mt-md">
            <FeedbackTab deliveryId={id!} feedbackFormId={delivery.feedback_form_id} satisfactionScore={delivery.satisfaction_score} />
          </TabsContent>

          <TabsContent value="documents" className="mt-md">
            <DocumentsTab projectId={delivery.project_id} />
          </TabsContent>
        </Tabs>
      </div>

      <AddSessionDialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen} deliveryId={id!} projectId={delivery.project_id} />
    </AppShell>
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
    <div className="space-y-sm">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 text-caption font-medium ${isOver ? 'text-destructive' : 'text-text-3'}`}>
          <Clock className="h-3.5 w-3.5" />
          {totalMinutes} / {targetMinutes} minutes planned
        </div>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Add Block</Button>
      </div>
      {items?.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-2 bg-background rounded border p-sm">
          <div className="flex flex-col shrink-0">
            <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="text-text-3 hover:text-foreground disabled:opacity-20">
              <ChevronUp className="h-3 w-3" />
            </button>
            <button onClick={() => moveItem(idx, 'down')} disabled={idx === (items?.length ?? 0) - 1} className="text-text-3 hover:text-foreground disabled:opacity-20">
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
          <Badge className={`text-xs capitalize shrink-0 ${TYPE_COLORS[item.type] || ''}`}>{item.type}</Badge>
          <span className="text-body flex-1 truncate">{item.title}</span>
          {item.method && <span className="text-caption text-text-3 shrink-0">{item.method}</span>}
          <span className="text-caption text-text-3 shrink-0 font-mono">{item.duration_minutes}m</span>
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
    <div className="flex items-center gap-2 bg-background rounded border p-sm flex-wrap">
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

  if (!feedbackFormId) {
    return <p className="text-text-2 text-center py-lg">No feedback form linked to this workshop.</p>;
  }

  return (
    <div className="space-y-md">
      <div className="grid grid-cols-2 gap-md">
        <Card>
          <CardContent className="pt-4">
            <p className="text-caption text-text-3">Satisfaction Score</p>
            <p className="text-section-title">{satisfactionScore ? `${satisfactionScore}/10` : '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-caption text-text-3">Responses</p>
            <p className="text-section-title">{responses?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <p className="text-body font-medium mb-sm">Public Form Link</p>
          <code className="text-mono text-xs bg-background rounded border p-sm block">
            {window.location.origin}/form/{feedbackFormId}
          </code>
        </CardContent>
      </Card>

      {responses?.length ? (
        <div className="space-y-xs">
          {responses.map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-4">
                <p className="text-caption text-text-3 mb-sm">
                  {new Date(r.submitted_at!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="space-y-xs">
                  {Object.entries(typeof r.data === 'string' ? JSON.parse(r.data) : r.data).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-body text-text-2">{key}</span>
                      <span className="text-body font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-text-2 text-center py-md">No responses yet.</p>
      )}
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
        <form onSubmit={handleSubmit} className="space-y-md">
          <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div><Label>Duration (mins)</Label><Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
          <div className="flex justify-end gap-sm">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createSession.isPending}>Add</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
