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
import { FolderKanban, CheckSquare, Briefcase, FileText, Plus, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
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

  const kpis = [
    {
      label: 'Active Projects',
      value: activeProjects,
      icon: FolderKanban,
      color: 'bg-[hsl(var(--info))]',
      bgColor: 'bg-[hsl(var(--info)/0.1)]',
      textColor: 'text-[hsl(var(--info))]',
    },
    {
      label: 'Pending Tasks',
      value: pendingTasks,
      icon: CheckSquare,
      color: 'bg-[hsl(var(--purple))]',
      bgColor: 'bg-[hsl(var(--purple)/0.1)]',
      textColor: 'text-[hsl(var(--purple))]',
    },
    {
      label: 'Workshops',
      value: upcomingWorkshops.length,
      icon: Briefcase,
      color: 'bg-[hsl(var(--cyan))]',
      bgColor: 'bg-[hsl(var(--cyan)/0.1)]',
      textColor: 'text-[hsl(var(--cyan))]',
    },
    {
      label: 'Revenue (Paid)',
      value: `£${totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-[hsl(var(--success))]',
      bgColor: 'bg-[hsl(var(--success)/0.1)]',
      textColor: 'text-[hsl(var(--success))]',
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div>
          <h1 className="text-page-title">{greeting()}{profile?.display_name ? `, ${profile.display_name}` : ''}</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening across your projects.</p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap">
          <Link to="/projects"><Button variant="outline" size="sm" className="gap-1.5 shadow-xs"><FolderKanban className="h-3.5 w-3.5" /> Projects</Button></Link>
          <Link to="/tasks"><Button variant="outline" size="sm" className="gap-1.5 shadow-xs"><CheckSquare className="h-3.5 w-3.5" /> Tasks</Button></Link>
          <Link to="/workshops"><Button variant="outline" size="sm" className="gap-1.5 shadow-xs"><Briefcase className="h-3.5 w-3.5" /> Workshops</Button></Link>
          <Link to="/invoices"><Button variant="outline" size="sm" className="gap-1.5 shadow-xs"><FileText className="h-3.5 w-3.5" /> Invoices</Button></Link>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-in">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                    <p className="text-2xl font-bold mt-1 tracking-tight">{kpi.value}</p>
                  </div>
                  <div className={`h-9 w-9 rounded-lg ${kpi.bgColor} flex items-center justify-center`}>
                    <kpi.icon className={`h-4.5 w-4.5 ${kpi.textColor}`} strokeWidth={2} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Overdue alerts */}
          {overdueTasks.length > 0 && (
            <Card className="border-destructive/20 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  Overdue Tasks
                  <Badge variant="destructive" className="ml-auto text-xs">{overdueTasks.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {overdueTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between bg-destructive/5 rounded-lg px-3 py-2.5">
                    <span className="text-sm font-medium truncate">{t.title}</span>
                    <span className="text-xs text-destructive font-medium shrink-0 ml-2">{t.due_date}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upcoming workshops */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-[hsl(var(--cyan)/0.1)] flex items-center justify-center">
                    <Briefcase className="h-3.5 w-3.5 text-[hsl(var(--cyan))]" />
                  </div>
                  Upcoming Workshops
                </CardTitle>
                <Link to="/workshops" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {upcomingWorkshops.length === 0 ? (
                <p className="text-muted-foreground text-sm py-3 text-center">No upcoming workshops</p>
              ) : upcomingWorkshops.map((d) => (
                <Link key={d.id} to={`/workshops/${d.id}`} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors cursor-pointer">
                  <span className="text-sm font-medium truncate">{d.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{d.delivery_date}</span>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent projects */}
          <Card className={`shadow-sm ${overdueTasks.length === 0 ? 'lg:col-span-2' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-[hsl(var(--info)/0.1)] flex items-center justify-center">
                    <FolderKanban className="h-3.5 w-3.5 text-[hsl(var(--info))]" />
                  </div>
                  Recent Projects
                </CardTitle>
                <Link to="/projects" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {!projects?.length ? (
                <div className="text-center py-6 space-y-3">
                  <p className="text-muted-foreground text-sm">No projects yet</p>
                  <Link to="/projects"><Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Create Project</Button></Link>
                </div>
              ) : projects.slice(0, 5).map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors cursor-pointer">
                  <div className="truncate">
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{(p as any).organisations?.name}</span>
                  </div>
                  <Badge className={`${getStatusBadgeClasses(p.status, 'project')} text-xs`}>{p.status.replace(/_/g, ' ')}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
