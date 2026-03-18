import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMeetings, useCreateMeeting } from '@/hooks/useMeetings';
import { useOrganisations } from '@/hooks/useOrganisations';
import { useGcalStatus, useGcalAuthUrl, useGcalCreateEvent, useGcalDeleteEvent } from '@/hooks/useGcalSync';
import { Plus, Calendar, MapPin, Clock, CalendarPlus, CalendarX, ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const MEETING_TYPES = ['discovery', 'check-in', 'review', 'planning', 'workshop', 'other'];

export default function Meetings() {
  const { data: meetings, isLoading } = useMeetings();
  const { data: orgs } = useOrganisations();
  const createMeeting  = useCreateMeeting();
  const [open, setOpen] = useState(false);
  const [searchParams]  = useSearchParams();

  const { data: gcalStatus }  = useGcalStatus();
  const gcalAuthUrl            = useGcalAuthUrl();
  const gcalCreateEvent        = useGcalCreateEvent();
  const gcalDeleteEvent        = useGcalDeleteEvent();

  // Handle OAuth callback
  useEffect(() => {
    const p = searchParams.get('gcal');
    if (p === 'connected') toast.success('Google Calendar connected!');
    else if (p === 'error') toast.error(`Calendar connection failed: ${searchParams.get('msg') ?? 'Unknown error'}`);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createMeeting.mutateAsync({
        title: fd.get('title') as string,
        meeting_type: fd.get('meeting_type') as string,
        scheduled_at: fd.get('scheduled_at') as string,
        duration_minutes: Number(fd.get('duration_minutes')) || 30,
        location: (fd.get('location') as string) || null,
        organisation_id: (fd.get('organisation_id') as string) || null,
        notes: (fd.get('notes') as string) || null,
      });
      toast.success('Meeting created');
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleGcalSync = async (meetingId: string, hasGcalEvent: boolean) => {
    if (!gcalStatus?.connected) {
      toast.error('Connect Google Calendar first in Settings → Integrations.');
      return;
    }
    try {
      if (hasGcalEvent) {
        await gcalDeleteEvent.mutateAsync(meetingId);
        toast.success('Removed from Google Calendar');
      } else {
        const result = await gcalCreateEvent.mutateAsync(meetingId);
        toast.success('Added to Google Calendar', {
          action: result?.htmlLink ? { label: 'Open', onClick: () => window.open(result.htmlLink, '_blank') } : undefined,
        });
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Sync failed');
    }
  };

  return (
    <AppShell>
      <div className="space-y-lg">
        <div className="flex items-center justify-between gap-sm flex-wrap">
          <h1 className="text-page-title">Meetings</h1>

          <div className="flex items-center gap-sm">
            {!gcalStatus?.connected ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => gcalAuthUrl.mutate()}
                disabled={gcalAuthUrl.isPending}
              >
                {gcalAuthUrl.isPending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  : <ExternalLink className="h-3.5 w-3.5 mr-1.5" />}
                Connect Calendar
              </Button>
            ) : (
              <Badge variant="secondary" className="bg-success/15 text-success border-success/20">
                <Calendar className="h-3 w-3 mr-1" />
                Calendar connected
              </Badge>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> New Meeting</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Meeting</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-md">
                  <div><Label>Title</Label><Input name="title" required className="mt-1" /></div>
                  <div>
                    <Label>Type</Label>
                    <Select name="meeting_type" defaultValue="discovery">
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MEETING_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Date & Time</Label><Input name="scheduled_at" type="datetime-local" required className="mt-1" /></div>
                  <div><Label>Duration (minutes)</Label><Input name="duration_minutes" type="number" defaultValue={30} className="mt-1" /></div>
                  <div><Label>Location</Label><Input name="location" className="mt-1" /></div>
                  <div>
                    <Label>Client</Label>
                    <Select name="organisation_id">
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent>
                        {orgs?.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Notes</Label><Textarea name="notes" className="mt-1" /></div>
                  <Button type="submit" disabled={createMeeting.isPending} className="w-full">Create Meeting</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <p className="text-text-2 text-center py-lg">Loading…</p>
        ) : !meetings?.length ? (
          <p className="text-text-2 text-center py-lg">No meetings scheduled.</p>
        ) : (
          <div className="space-y-xs">
            {meetings.map((m) => {
              const hasGcal = !!(m as any).gcal_event_id;
              const isSyncing = gcalCreateEvent.isPending || gcalDeleteEvent.isPending;
              return (
                <Card key={m.id}>
                  <CardContent className="py-md flex items-center justify-between gap-md">
                    <div className="min-w-0">
                      <div className="flex items-center gap-sm">
                        <p className="font-medium text-body">{m.title}</p>
                        {hasGcal && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Calendar className="h-3.5 w-3.5 text-success shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent>Synced to Google Calendar</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <div className="flex items-center gap-md text-caption text-text-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(m.scheduled_at), 'dd MMM yyyy, HH:mm')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{m.duration_minutes}min
                        </span>
                        {m.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />{m.location}
                          </span>
                        )}
                      </div>
                      {(m as any).organisations?.name && (
                        <p className="text-caption text-text-3 mt-0.5">{(m as any).organisations.name}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-sm shrink-0">
                      <Badge variant="secondary">{m.meeting_type}</Badge>
                      {gcalStatus?.connected && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGcalSync(m.id, hasGcal)}
                              disabled={isSyncing}
                            >
                              {isSyncing
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : hasGcal
                                  ? <CalendarX className="h-3.5 w-3.5 text-destructive" />
                                  : <CalendarPlus className="h-3.5 w-3.5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {hasGcal ? 'Remove from Google Calendar' : 'Add to Google Calendar'}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
