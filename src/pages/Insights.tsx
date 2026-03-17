import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjects } from '@/hooks/useProjects';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useInvoices } from '@/hooks/useInvoices';
import { useTasks } from '@/hooks/useTasks';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--secondary))', '#94a3b8', '#64748b'];

export default function Insights() {
  const { data: projects } = useProjects();
  const { data: deliveries } = useDeliveries();
  const { data: invoices } = useInvoices();
  const { data: tasks } = useTasks();

  const projectsByStatus = Object.entries(
    (projects ?? []).reduce<Record<string, number>>((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

  const tasksByStatus = Object.entries(
    (tasks ?? []).reduce<Record<string, number>>((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

  const revenueByMonth: Record<string, number> = {};
  (invoices ?? []).filter((i) => i.status === 'paid' && i.paid_date).forEach((i) => {
    const month = i.paid_date!.substring(0, 7);
    revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(i.total);
  });
  const revenueData = Object.entries(revenueByMonth).sort().slice(-6).map(([month, total]) => ({ month, total }));

  return (
    <AppShell>
      <div className="space-y-lg">
        <h1 className="text-page-title">Insights</h1>

        <Tabs defaultValue="business">
          <TabsList>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
          </TabsList>

          <TabsContent value="business" className="mt-md">
            <div className="grid grid-cols-2 gap-lg">
              <Card>
                <CardHeader><CardTitle className="text-body">Projects by Status</CardTitle></CardHeader>
                <CardContent className="h-64">
                  {projectsByStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={projectsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {projectsByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie><Tooltip /></PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-text-2 text-center pt-20">No data yet.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-body">Tasks by Status</CardTitle></CardHeader>
                <CardContent className="h-64">
                  {tasksByStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={tasksByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {tasksByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie><Tooltip /></PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-text-2 text-center pt-20">No data yet.</p>}
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader><CardTitle className="text-body">Revenue by Month</CardTitle></CardHeader>
                <CardContent className="h-64">
                  {revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-text-2 text-center pt-20">No revenue data yet.</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="personal" className="mt-md">
            <Card>
              <CardContent className="pt-6 text-center text-text-2">
                <p>Personal insights (energy tracking, focus patterns) coming in Phase 2.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
