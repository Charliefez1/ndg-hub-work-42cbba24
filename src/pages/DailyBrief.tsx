import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useTasks } from '@/hooks/useTasks';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useDailyBrief } from '@/hooks/useDailyBrief';
import { useTodayState, useUpsertDailyState } from '@/hooks/useDailyStates';
import { useAuth } from '@/hooks/useAuth';
import { CalendarCheck, AlertTriangle, CheckCircle2, Clock, Battery, Brain, Smile, FileWarning } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const MOODS = ['😤', '😔', '😐', '😊', '🤩'];

export default function DailyBrief() {
  const { user } = useAuth();
  const { data: tasks } = useTasks();
  const { data: deliveries } = useDeliveries();
  const { data: briefData } = useDailyBrief();
  const { data: todayState } = useTodayState(user?.id);
  const upsertState = useUpsertDailyState();

  const [energy, setEnergy] = useState<number>(todayState?.energy_level ?? 5);
  const [focus, setFocus] = useState<number>(todayState?.focus_level ?? 5);
  const [moodIdx, setMoodIdx] = useState<number>(todayState?.mood ? MOODS.indexOf(todayState.mood) : 2);
  const [notes, setNotes] = useState(todayState?.notes ?? '');
  const [checkedIn, setCheckedIn] = useState(!!todayState);

  // Sync state from loaded data
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks?.filter((t) => t.due_date === today && t.status !== 'done') ?? [];
  const overdueTasks = tasks?.filter((t) => t.due_date && t.due_date < today && t.status !== 'done') ?? [];
  const upcomingDeliveries = deliveries?.filter((d) => d.delivery_date && d.delivery_date >= today)
    .sort((a, b) => (a.delivery_date! > b.delivery_date! ? 1 : -1))
    .slice(0, 5) ?? [];
  const completedToday = tasks?.filter((t) => t.status === 'done' && t.updated_at?.startsWith(today)).length ?? 0;

  // Red flags from edge function
  const brief = briefData?.data;
  const redFlags = brief?.redFlags ?? [];

  const handleCheckIn = () => {
    if (!user?.id) return;
    upsertState.mutate(
      {
        user_id: user.id,
        date: today,
        energy_level: energy,
        focus_level: focus,
        mood: MOODS[moodIdx] ?? '😐',
        notes: notes || null,
      },
      {
        onSuccess: () => {
          setCheckedIn(true);
          toast.success('Daily check-in saved');
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  return (
    <AppShell>
      <div className="space-y-lg">
        <h1 className="text-page-title">Daily Brief</h1>
        <p className="text-body text-text-2">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
          <Card><CardContent className="pt-4 flex items-center gap-md">
            <Clock className="h-8 w-8 text-primary" />
            <div><p className="text-caption text-text-3">Due Today</p><p className="text-section-title">{todayTasks.length}</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-md">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div><p className="text-caption text-text-3">Overdue</p><p className="text-section-title text-destructive">{overdueTasks.length}</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-md">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div><p className="text-caption text-text-3">Completed Today</p><p className="text-section-title">{completedToday}</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-md">
            <CalendarCheck className="h-8 w-8 text-accent-foreground" />
            <div><p className="text-caption text-text-3">Upcoming Workshops</p><p className="text-section-title">{upcomingDeliveries.length}</p></div>
          </CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
          {/* Energy check-in */}
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle className="text-body flex items-center gap-2"><Battery className="h-4 w-4" /> Daily Check-in</CardTitle></CardHeader>
            <CardContent className="space-y-md">
              <div>
                <Label className="flex items-center gap-2 mb-2"><Battery className="h-3.5 w-3.5" /> Energy: {energy}/10</Label>
                <Slider value={[energy]} onValueChange={([v]) => setEnergy(v)} min={1} max={10} step={1} />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2"><Brain className="h-3.5 w-3.5" /> Focus: {focus}/10</Label>
                <Slider value={[focus]} onValueChange={([v]) => setFocus(v)} min={1} max={10} step={1} />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2"><Smile className="h-3.5 w-3.5" /> Mood</Label>
                <div className="flex gap-sm">
                  {MOODS.map((m, i) => (
                    <button
                      key={m}
                      onClick={() => setMoodIdx(i)}
                      className={`text-2xl p-1 rounded transition-all ${moodIdx === i ? 'bg-primary/10 scale-125 ring-2 ring-primary' : 'hover:scale-110'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2">Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How are you feeling?" rows={2} />
              </div>
              <Button onClick={handleCheckIn} className="w-full" disabled={upsertState.isPending}>
                {checkedIn || todayState ? 'Update Check-in' : 'Check In'}
              </Button>
            </CardContent>
          </Card>

          {/* Focus tasks + upcoming */}
          <div className="lg:col-span-2 space-y-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <Card>
                <CardHeader><CardTitle className="text-body">Focus Tasks</CardTitle></CardHeader>
                <CardContent className="space-y-xs">
                  {todayTasks.length === 0 ? <p className="text-text-2 text-caption">Nothing due today — nice!</p> : todayTasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between bg-background rounded border p-sm">
                      <span className="text-body">{t.title}</span>
                      <Badge variant="outline" className="capitalize text-xs">{t.priority}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-body">Upcoming Workshops</CardTitle></CardHeader>
                <CardContent className="space-y-xs">
                  {upcomingDeliveries.length === 0 ? <p className="text-text-2 text-caption">No upcoming workshops.</p> : upcomingDeliveries.map((d) => (
                    <div key={d.id} className="flex items-center justify-between bg-background rounded border p-sm">
                      <span className="text-body">{d.title}</span>
                      <span className="text-caption text-text-3">{d.delivery_date}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Red flags */}
            {redFlags.length > 0 && (
              <Card className="border-destructive/30">
                <CardHeader><CardTitle className="text-body text-destructive flex items-center gap-2"><FileWarning className="h-4 w-4" /> Red Flags</CardTitle></CardHeader>
                <CardContent className="space-y-xs">
                  {redFlags.map((f: any, i: number) => (
                    <div key={i} className="flex items-center gap-sm bg-destructive/5 rounded border border-destructive/20 p-sm">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                      <span className="text-body">{f.label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {overdueTasks.length > 0 && (
              <Card className="border-destructive/30">
                <CardHeader><CardTitle className="text-body text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Overdue Tasks</CardTitle></CardHeader>
                <CardContent className="space-y-xs">
                  {overdueTasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between bg-background rounded border p-sm">
                      <span className="text-body">{t.title}</span>
                      <span className="text-caption text-destructive">{t.due_date}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
