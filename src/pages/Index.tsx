import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useTasks } from '@/hooks/useTasks';
import { useInvoices } from '@/hooks/useInvoices';
import { FolderKanban, CheckSquare, Briefcase, FileText, Plus, AlertTriangle } from 'lucide-react';
import { getStatusBadgeClasses } from '@/lib/status-colors';

export default function Home() {
  const { profile } = useAuth();
  const { data: projects } = useProjects();
  const { data: deliveries } = useDeliveries();
  const { data: tasks } = useTasks();
  const { data: invoices } = useInvoices();

  const today = new Date().toISOString().split('T')[0];
  const activeProjects = projects?.filter((p) => p.status !== 'closed').length ?? 0;
  const pendingTasks = tasks?.filter((t) => t.status !== 'done').length ?? 0;
  const overdueTasks = tasks?.filter((t) => t.due_date && t.due_date < today && t.status !== 'done') ?? [];
  const upcomingWorkshops = deliveries?.filter((d) => d.delivery_date && d.delivery_date >= today).slice(0, 3) ?? [];
  const totalRevenue = invoices?.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0) ?? 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AppShell>
      <div className="space-y-lg">
        <div>
          <h1 className="text-page-title">{greeting()}{profile?.display_name ? `, ${profile.display_name}` : ''}!</h1>
          <p className="text-body text-text-2 mt-1">Here's what's happening across your projects.</p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-sm flex-wrap">
          <Link to="/projects"><Button variant="outline" size="sm"><FolderKanban className="h-3.5 w-3.5 mr-1" /> Projects</Button></Link>
          <Link to="/tasks"><Button variant="outline" size="sm"><CheckSquare className="h-3.5 w-3.5 mr-1" /> Tasks</Button></Link>
          <Link to="/workshops"><Button variant="outline" size="sm"><Briefcase className="h-3.5 w-3.5 mr-1" /> Workshops</Button></Link>
          <Link to="/invoices"><Button variant="outline" size="sm"><FileText className="h-3.5 w-3.5 mr-1" /> Invoices</Button></Link>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-md">
          <Card><CardContent className="pt-4">
            <p className="text-caption text-text-3">Active Projects</p>
            <p className="text-section-title">{activeProjects}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-caption text-text-3">Pending Tasks</p>
            <p className="text-section-title">{pendingTasks}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-caption text-text-3">Upcoming Workshops</p>
            <p className="text-section-title">{upcomingWorkshops.length}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-caption text-text-3">Revenue (Paid)</p>
            <p className="text-section-title">£{totalRevenue.toLocaleString()}</p>
          </CardContent></Card>
        </div>

        <div className="grid grid-cols-2 gap-lg">
          {/* Overdue alerts */}
          {overdueTasks.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader><CardTitle className="text-body flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Overdue Tasks</CardTitle></CardHeader>
              <CardContent className="space-y-xs">
                {overdueTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between bg-background rounded border p-sm">
                    <span className="text-body truncate">{t.title}</span>
                    <span className="text-caption text-destructive shrink-0 ml-2">{t.due_date}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upcoming workshops */}
          <Card>
            <CardHeader><CardTitle className="text-body">Workshops This Week</CardTitle></CardHeader>
            <CardContent className="space-y-xs">
              {upcomingWorkshops.length === 0 ? <p className="text-text-2 text-caption">No upcoming workshops.</p> : upcomingWorkshops.map((d) => (
                <Link key={d.id} to={`/workshops/${d.id}`} className="flex items-center justify-between bg-background rounded border p-sm hover:border-primary transition-colors">
                  <span className="text-body truncate">{d.title}</span>
                  <span className="text-caption text-text-3 shrink-0 ml-2">{d.delivery_date}</span>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent projects */}
          <Card className={overdueTasks.length === 0 ? 'col-span-2' : ''}>
            <CardHeader><CardTitle className="text-body">Recent Projects</CardTitle></CardHeader>
            <CardContent className="space-y-xs">
              {!projects?.length ? <p className="text-text-2 text-caption">No projects yet.</p> : projects.slice(0, 5).map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between bg-background rounded border p-sm hover:border-primary transition-colors">
                  <div className="truncate">
                    <span className="text-body font-medium">{p.name}</span>
                    <span className="text-caption text-text-3 ml-2">{(p as any).organisations?.name}</span>
                  </div>
                  <Badge className={getStatusBadgeClasses(p.status, 'project')}>{p.status.replace('_', ' ')}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
