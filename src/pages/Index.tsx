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
import { useDailyStates } from '@/hooks/useDailyStates';
import { FolderKanban, CheckSquare, Briefcase, FileText, Plus, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { getStatusBadgeClasses } from '@/lib/status-colors';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { PipelineStrip } from '@/components/dashboard/PipelineStrip';
import { RevenueSparkline } from '@/components/dashboard/RevenueSparkline';
import { FocusQuickStart } from '@/components/dashboard/FocusQuickStart';

export default function Home() {
  const { profile, user } = useAuth();
  const { data: projects } = useProjects();
  const { data: deliveries } = useDeliveries();
  const { data: tasks } = useTasks();
  const { data: invoices } = useInvoices();

  const today = new Date().toISOString().split('T')[0];
  const activeProjects = projects?.filter((p) => p.status !== 'closed').length ?? 0;
  const pendingTasks = tasks?.filter((t) => t.status !== 'done').length ?? 0;
  const overdueTasks = tasks?.filter((t) => t.due_date && t.due_date < today && t.status !== 'done') ?? [];
  const upcomingWorkshops = deliveries?.filter((d) => d.delivery_date && d.delivery_date >= today).slice(0, 3) ?? [];

  const moodEmojis: Record<string, string> = {
    great: '🔥', good: '😊', okay: '😐', low: '😔', stressed: '😰',
  };

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
      bgColor: 'bg-[hsl(var(--info)/0.1)]',
      textColor: 'text-[hsl(var(--info))]',
      ring: 'ring-[hsl(var(--info)/0.15)]',
    },
    {
      label: 'Pending Tasks',
      value: pendingTasks,
      icon: CheckSquare,
      bgColor: 'bg-[hsl(var(--purple)/0.1)]',
      textColor: 'text-[hsl(var(--purple))]',
      ring: 'ring-[hsl(var(--purple)/0.15)]',
    },
    {
      label: 'Workshops',
      value: upcomingWorkshops.length,
      icon: Briefcase,
      bgColor: 'bg-[hsl(var(--cyan)/0.1)]',
      textColor: 'text-[hsl(var(--cyan))]',
      ring: 'ring-[hsl(var(--cyan)/0.15)]',
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-2">
            <h1 className="text-page-title">{greeting()}{profile?.display_name ? `, ${profile.display_name}` : ''}</h1>
            <Sparkles className="h-5 w-5 text-warning animate-pulse" />
          </div>
          <p className="text-muted-foreground mt-1">Here's what's happening across your projects.</p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <Link to="/projects"><Button variant="outline" size="sm" className="gap-1.5 shadow-xs hover:shadow-sm transition-all"><FolderKanban className="h-3.5 w-3.5" /> Projects</Button></Link>
          <Link to="/tasks"><Button variant="outline" size="sm" className="gap-1.5 shadow-xs hover:shadow-sm transition-all"><CheckSquare className="h-3.5 w-3.5" /> Tasks</Button></Link>
          <Link to="/workshops"><Button variant="outline" size="sm" className="gap-1.5 shadow-xs hover:shadow-sm transition-all"><Briefcase className="h-3.5 w-3.5" /> Workshops</Button></Link>
          <Link to="/invoices"><Button variant="outline" size="sm" className="gap-1.5 shadow-xs hover:shadow-sm transition-all"><FileText className="h-3.5 w-3.5" /> Invoices</Button></Link>
        </div>

        {/* KPI cards + Revenue sparkline */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-in">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 ring-1 ring-transparent hover:ring-border/50">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                    <p className="text-2xl font-bold mt-1.5 tracking-tight">{kpi.value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-xl ${kpi.bgColor} ring-1 ${kpi.ring} flex items-center justify-center`}>
                    <kpi.icon className={`h-[18px] w-[18px] ${kpi.textColor}`} strokeWidth={1.75} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Revenue Sparkline KPI */}
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 ring-1 ring-transparent hover:ring-border/50">
            <CardContent className="pt-5 pb-4 px-5">
              <RevenueSparkline invoices={invoices} />
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Strip */}
        <PipelineStrip projects={projects} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Overdue alerts */}
          {overdueTasks.length > 0 && (
            <Card className="border-destructive/20 shadow-sm animate-fade-in-up">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  Overdue Tasks
                  <Badge variant="destructive" className="ml-auto text-xs">{overdueTasks.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {overdueTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between bg-destructive/5 rounded-lg px-3 py-2.5 hover:bg-destructive/10 transition-colors">
                    <span className="text-sm font-medium truncate">{t.title}</span>
                    <span className="text-xs text-destructive font-medium shrink-0 ml-2">{t.due_date}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Focus Quick Start */}
          <FocusQuickStart />

          {/* Activity Feed */}
          <ActivityFeed />

          {/* Upcoming workshops */}
          <Card className="shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[hsl(var(--cyan)/0.1)] flex items-center justify-center">
                    <Briefcase className="h-3.5 w-3.5 text-[hsl(var(--cyan))]" />
                  </div>
                  Upcoming Workshops
                </CardTitle>
                <Link to="/workshops" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {upcomingWorkshops.length === 0 ? (
                <p className="text-muted-foreground text-sm py-3 text-center">No upcoming workshops</p>
              ) : upcomingWorkshops.map((d) => (
                <Link key={d.id} to={`/workshops/${d.id}`} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors cursor-pointer group">
                  <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{d.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{d.delivery_date}</span>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent projects */}
          <Card className={`shadow-sm animate-fade-in-up ${overdueTasks.length === 0 ? '' : ''}`} style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[hsl(var(--info)/0.1)] flex items-center justify-center">
                    <FolderKanban className="h-3.5 w-3.5 text-[hsl(var(--info))]" />
                  </div>
                  Recent Projects
                </CardTitle>
                <Link to="/projects" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {!projects?.length ? (
                <div className="text-center py-6 space-y-3">
                  <p className="text-muted-foreground text-sm">No projects yet</p>
                  <Link to="/projects"><Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Create Project</Button></Link>
                </div>
              ) : projects.slice(0, 5).map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors cursor-pointer group">
                  <div className="truncate">
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">{p.name}</span>
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
