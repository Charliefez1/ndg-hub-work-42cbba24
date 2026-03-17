import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTasks } from '@/hooks/useTasks';
import { useDeliveries } from '@/hooks/useDeliveries';
import { CalendarCheck, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO, isPast } from 'date-fns';

export default function DailyBrief() {
  const { data: tasks } = useTasks();
  const { data: deliveries } = useDeliveries();

  const today = new Date().toISOString().split('T')[0];

  const todayTasks = tasks?.filter((t) => t.due_date === today && t.status !== 'done') ?? [];
  const overdueTasks = tasks?.filter((t) => t.due_date && t.due_date < today && t.status !== 'done') ?? [];
  const upcomingDeliveries = deliveries?.filter((d) => d.delivery_date && d.delivery_date >= today)
    .sort((a, b) => (a.delivery_date! > b.delivery_date! ? 1 : -1))
    .slice(0, 5) ?? [];
  const completedToday = tasks?.filter((t) => t.status === 'done' && t.updated_at?.startsWith(today)).length ?? 0;

  return (
    <AppShell>
      <div className="space-y-lg">
        <h1 className="text-page-title">Daily Brief</h1>
        <p className="text-body text-text-2">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>

        <div className="grid grid-cols-4 gap-md">
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

        <div className="grid grid-cols-2 gap-lg">
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
    </AppShell>
  );
}
