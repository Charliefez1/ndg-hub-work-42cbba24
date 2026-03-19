import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMeetings, useCreateMeeting, useUpdateMeeting, useDeleteMeeting, type Meeting } from '@/hooks/useMeetings';
import { useOrganisations } from '@/hooks/useOrganisations';
import { Plus, Calendar, MapPin, Clock, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const MEETING_TYPES = ['discovery', 'check-in', 'review', 'planning', 'workshop', 'other'];

export default function Meetings() {
  const { data: meetings, isLoading } = useMeetings();
  const deleteMeeting = useDeleteMeeting();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this meeting?')) return;
    try { await deleteMeeting.mutateAsync(id); toast.success('Meeting deleted'); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Meetings</h1>
          <Button size="sm" onClick={() => { setEditingMeeting(null); setDialogOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New Meeting
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-4">Loading…</p>
        ) : !meetings?.length ? (
          <p className="text-muted-foreground text-center py-4">No meetings scheduled.</p>
        ) : (
          <div className="space-y-1.5">
            {meetings.map((m) => (
              <Card key={m.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{m.title}</p>
                    <div className="flex items-center gap-3 text-caption text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(m.scheduled_at), 'dd MMM yyyy, HH:mm')}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{m.duration_minutes}min</span>
                      {m.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.location}</span>}
                    </div>
                    {(m as any).organisations?.name && (
                      <p className="text-caption text-muted-foreground mt-0.5">{(m as any).organisations.name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{m.meeting_type}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingMeeting(m); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(m.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <MeetingDialog
        key={editingMeeting?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        meeting={editingMeeting}
      />
    </AppShell>
  );
}

function MeetingDialog({ open, onOpenChange, meeting }: { open: boolean; onOpenChange: (o: boolean) => void; meeting: Meeting | null }) {
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const { data: orgs } = useOrganisations();
  const isEdit = !!meeting;

  const formatDateTimeLocal = (dt: string) => {
    try { return new Date(dt).toISOString().slice(0, 16); } catch { return ''; }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: fd.get('title') as string,
      meeting_type: fd.get('meeting_type') as string,
      scheduled_at: fd.get('scheduled_at') as string,
      duration_minutes: Number(fd.get('duration_minutes')) || 30,
      location: (fd.get('location') as string) || null,
      organisation_id: (fd.get('organisation_id') as string) || null,
      notes: (fd.get('notes') as string) || null,
    };
    try {
      if (isEdit) {
        await updateMeeting.mutateAsync({ id: meeting.id, ...payload });
        toast.success('Meeting updated');
      } else {
        await createMeeting.mutateAsync(payload);
        toast.success('Meeting created');
      }
      onOpenChange(false);
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Meeting' : 'New Meeting'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Title</Label><Input name="title" required defaultValue={meeting?.title ?? ''} className="mt-1" /></div>
          <div><Label>Type</Label>
            <Select name="meeting_type" defaultValue={meeting?.meeting_type ?? 'discovery'}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{MEETING_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Date & Time</Label><Input name="scheduled_at" type="datetime-local" required defaultValue={meeting ? formatDateTimeLocal(meeting.scheduled_at) : ''} className="mt-1" /></div>
          <div><Label>Duration (minutes)</Label><Input name="duration_minutes" type="number" defaultValue={meeting?.duration_minutes ?? 30} className="mt-1" /></div>
          <div><Label>Location</Label><Input name="location" defaultValue={meeting?.location ?? ''} className="mt-1" /></div>
          <div><Label>Client</Label>
            <Select name="organisation_id" defaultValue={meeting?.organisation_id ?? ''}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>{orgs?.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Notes</Label><Textarea name="notes" defaultValue={meeting?.notes ?? ''} className="mt-1" /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createMeeting.isPending || updateMeeting.isPending}>
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
