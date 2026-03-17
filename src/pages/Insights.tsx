import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjects } from '@/hooks/useProjects';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useInvoices } from '@/hooks/useInvoices';
import { useTasks } from '@/hooks/useTasks';
import { useInsightsPersonal } from '@/hooks/useInsights';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--secondary))', '#94a3b8', '#64748b'];

export default function Insights() {
  const { data: projects } = useProjects();
  const { data: deliveries } = useDeliveries();
  const { data: invoices } = useInvoices();
  const { data: tasks } = useTasks();
  const { data: personalData } = useInsightsPersonal();

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

  // Personal insights from edge function
  const personal = personalData?.data;
  const energyOverTime = personal?.energyOverTime ?? [];
  const focusByDay = personal?.focusByDay ?? [];
  const recovery = personal?.recovery;
  const optimalWindow = personal?.optimalWindow;

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
            <div className="space-y-lg">
              {/* Optimal window insight */}
              {optimalWindow && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="pt-4">
                    <p className="text-body font-medium">💡 {optimalWindow}</p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
                {/* Energy over time */}
                <Card>
                  <CardHeader><CardTitle className="text-body">Energy & Focus (30 days)</CardTitle></CardHeader>
                  <CardContent className="h-64">
                    {energyOverTime.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={energyOverTime}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickFormatter={(d: string) => d.substring(5)} />
                          <YAxis domain={[0, 10]} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="energy" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="focus" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : <p className="text-text-2 text-center pt-20">Log your daily energy to see trends.</p>}
                  </CardContent>
                </Card>

                {/* Focus by day of week */}
                <Card>
                  <CardHeader><CardTitle className="text-body">Focus by Day of Week</CardTitle></CardHeader>
                  <CardContent className="h-64">
                    {focusByDay.some((d: any) => d.avgFocus !== null) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={focusByDay}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis domain={[0, 10]} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="avgEnergy" name="Avg Energy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="avgFocus" name="Avg Focus" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-text-2 text-center pt-20">Not enough data yet.</p>}
                  </CardContent>
                </Card>
              </div>

              {/* Recovery stats */}
              {recovery && (recovery.avgEnergyDeliveryDays !== null || recovery.avgEnergyNonDeliveryDays !== null) && (
                <Card>
                  <CardHeader><CardTitle className="text-body">Recovery: Delivery vs Non-Delivery Days</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-md">
                      <div className="text-center p-md bg-background rounded border">
                        <p className="text-section-title">{recovery.avgEnergyDeliveryDays ?? '—'}</p>
                        <p className="text-caption text-text-3">Avg energy on delivery days ({recovery.deliveryDaysCount} days)</p>
                      </div>
                      <div className="text-center p-md bg-background rounded border">
                        <p className="text-section-title">{recovery.avgEnergyNonDeliveryDays ?? '—'}</p>
                        <p className="text-caption text-text-3">Avg energy on rest days ({recovery.nonDeliveryDaysCount} days)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
