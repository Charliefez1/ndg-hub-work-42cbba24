import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useTasks } from '@/hooks/useTasks';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useDailyBrief } from '@/hooks/useDailyBrief';
import { useTodayState, useUpsertDailyState } from '@/hooks/useDailyStates';
import { useAuth } from '@/hooks/useAuth';
import { useAIDailyCoach } from '@/hooks/useAIDailyCoach';
import { CalendarCheck, AlertTriangle, CheckCircle2, Clock, Battery, Brain, Smile, FileWarning, Sparkles, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const MOODS = ['😤', '😔', '😐', '😊', '🤩'];

export default function DailyBrief() {
  const { user } = useAuth();
  const { data: tasks } = useTasks();
  const { data: deliveries } = useDeliveries();
  const { data: briefData } = useDailyBrief();
  const { data: todayState } = useTodayState(user?.id);
  const upsertState = useUpsertDailyState();
  const { data: aiCoach, isLoading: coachLoading, refetch: refetchCoach } = useAIDailyCoach();

  const [energy, setEnergy] = useState<number>(todayState?.energy_level ?? 5);
  const [focus, setFocus] = useState<number>(todayState?.focus_level ?? 5);
  const [moodIdx, setMoodIdx] = useState<number>(todayState?.mood ? MOODS.indexOf(todayState.mood) : 2);
  const [notes, setNotes] = useState(todayState?.notes ?? '');
  const [checkedIn, setCheckedIn] = useState(!!todayState);

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks?.filter((t) => t.due_date === today && t.status !== 'done' && !t.parent_task_id) ?? [];
  const overdueTasks = tasks?.filter((t) => t.due_date && t.due_date < today && t.status !== 'done' && !t.parent_task_id) ?? [];
  const upcomingDeliveries = deliveries?.filter((d) => d.delivery_date && d.delivery_date >= today)
    .sort((a, b) => (a.delivery_date! > b.delivery_date! ? 1 : -1))
    .slice(0, 5) ?? [];
  const completedToday = tasks?.filter((t) => t.status === 'done' && t.updated_at?.startsWith(today)).length ?? 0;

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

  const kpis = [
    { label: 'Due Today', value: todayTasks.length, icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Overdue', value: overdueTasks.length, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Completed', value: completedToday, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Workshops', value: upcomingDeliveries.length, icon: CalendarCheck, color: 'text-[hsl(var(--cyan))]', bg: 'bg-[hsl(var(--cyan)/0.1)]' },
  ];

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <h1 className="text-page-title">Daily Brief</h1>
          <p className="text-muted-foreground mt-1">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>

        {/* AI Coach Card */}
        <Card className="border-primary/20 bg-primary/[0.02] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                AI Daily Coach
              </span>
              <Button variant="ghost" size="sm" onClick={() => refetchCoach()} disabled={coachLoading}>
                <RefreshCw className={`h-3.5 w-3.5 ${coachLoading ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coachLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : aiCoach?.message ? (
              <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                <ReactMarkdown>{aiCoach.message}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Check in first to get your personalized daily coaching brief.</p>
            )}
          </CardContent>
        </Card>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-in">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="shadow-sm">
              <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${kpi.bg} flex items-center justify-center shrink-0`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                  <p className={`text-xl font-bold ${kpi.label === 'Overdue' && overdueTasks.length > 0 ? 'text-destructive' : ''}`}>{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Energy check-in */}
          <Card className="lg:col-span-1 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-[hsl(var(--purple)/0.1)] flex items-center justify-center">
                  <Battery className="h-3.5 w-3.5 text-[hsl(var(--purple))]" />
                </div>
                Daily Check-in
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-2.5 text-xs font-medium">
                  <Battery className="h-3.5 w-3.5 text-[hsl(var(--orange))]" /> Energy
                  <span className="ml-auto font-bold text-sm">{energy}/10</span>
                </Label>
                <Slider value={[energy]} onValueChange={([v]) => setEnergy(v)} min={1} max={10} step={1} />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2.5 text-xs font-medium">
                  <Brain className="h-3.5 w-3.5 text-[hsl(var(--info))]" /> Focus
                  <span className="ml-auto font-bold text-sm">{focus}/10</span>
                </Label>
                <Slider value={[focus]} onValueChange={([v]) => setFocus(v)} min={1} max={10} step={1} />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2.5 text-xs font-medium">
                  <Smile className="h-3.5 w-3.5 text-[hsl(var(--pink))]" /> Mood
                </Label>
                <div className="flex gap-1.5">
                  {MOODS.map((m, i) => (
                    <button
                      key={m}
                      onClick={() => setMoodIdx(i)}
                      className={`text-2xl p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                        moodIdx === i
                          ? 'bg-primary/10 scale-110 ring-2 ring-primary shadow-sm'
                          : 'hover:bg-muted hover:scale-105'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 text-xs font-medium">Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How are you feeling?" rows={2} className="mt-1.5" />
              </div>
              <Button onClick={handleCheckIn} className="w-full" disabled={upsertState.isPending}>
                {checkedIn || todayState ? 'Update Check-in' : 'Check In'}
              </Button>
            </CardContent>
          </Card>

          {/* Focus tasks + upcoming */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-[hsl(var(--info)/0.1)] flex items-center justify-center">
                      <Clock className="h-3.5 w-3.5 text-[hsl(var(--info))]" />
                    </div>
                    Focus Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {todayTasks.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-3 text-center">Nothing due today — nice!</p>
                  ) : todayTasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between bg-background rounded-xl border px-3 py-2.5">
                      <span className="text-sm font-medium truncate">{t.title}</span>
                      <Badge variant="outline" className="capitalize text-xs shrink-0">{t.priority}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-[hsl(var(--cyan)/0.1)] flex items-center justify-center">
                      <CalendarCheck className="h-3.5 w-3.5 text-[hsl(var(--cyan))]" />
                    </div>
                    Upcoming Workshops
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {upcomingDeliveries.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-3 text-center">No upcoming workshops.</p>
                  ) : upcomingDeliveries.map((d) => (
                    <div key={d.id} className="flex items-center justify-between bg-background rounded-xl border px-3 py-2.5">
                      <span className="text-sm font-medium truncate">{d.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{d.delivery_date}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {redFlags.length > 0 && (
              <Card className="border-destructive/20 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-destructive/10 flex items-center justify-center">
                      <FileWarning className="h-3.5 w-3.5 text-destructive" />
                    </div>
                    Red Flags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {redFlags.map((f: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 bg-destructive/5 rounded-xl border border-destructive/20 px-3 py-2.5">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                      <span className="text-sm font-medium">{f.label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {overdueTasks.length > 0 && (
              <Card className="border-destructive/20 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    </div>
                    Overdue Tasks
                    <Badge variant="destructive" className="ml-auto text-xs">{overdueTasks.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {overdueTasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between bg-destructive/5 rounded-lg px-3 py-2.5">
                      <span className="text-sm font-medium truncate">{t.title}</span>
                      <span className="text-xs text-destructive font-medium shrink-0 ml-2">{t.due_date}</span>
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
