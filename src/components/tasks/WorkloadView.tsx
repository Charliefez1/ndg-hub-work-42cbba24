import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  todo: 'hsl(var(--muted-foreground))',
  in_progress: 'hsl(var(--info))',
  review: 'hsl(262 80% 50%)',
  blocked: 'hsl(var(--destructive))',
  done: 'hsl(var(--success))',
};

interface WorkloadViewProps {
  tasks: any[];
}

export function WorkloadView({ tasks }: WorkloadViewProps) {
  const { data: profiles } = useQuery({
    queryKey: ['profiles-workload'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, display_name');
      if (error) throw error;
      return data;
    },
  });

  const parentTasks = tasks.filter(t => !t.parent_task_id && !t.is_template);
  const assignedTasks = parentTasks.filter(t => t.assignee);
  const unassigned = parentTasks.filter(t => !t.assignee && t.status !== 'done');

  // Group by assignee
  const byAssignee: Record<string, { todo: number; in_progress: number; review: number; blocked: number; done: number; total: number }> = {};
  for (const t of assignedTasks) {
    if (!byAssignee[t.assignee]) byAssignee[t.assignee] = { todo: 0, in_progress: 0, review: 0, blocked: 0, done: 0, total: 0 };
    const status = t.status as keyof typeof byAssignee[string];
    if (status in byAssignee[t.assignee]) byAssignee[t.assignee][status]++;
    byAssignee[t.assignee].total++;
  }

  const profileMap = new Map((profiles || []).map(p => [p.id, p.display_name || 'Unknown']));

  const chartData = Object.entries(byAssignee)
    .map(([userId, counts]) => ({
      name: profileMap.get(userId) || 'Unknown',
      ...counts,
      active: counts.todo + counts.in_progress + counts.review + counts.blocked,
    }))
    .sort((a, b) => b.active - a.active);

  const OVERLOAD_THRESHOLD = 10;

  return (
    <div className="space-y-lg">
      {/* Chart */}
      <div className="bg-surface rounded-lg border p-md">
        <h3 className="text-section-title mb-md">Task Distribution by Team Member</h3>
        {chartData.length === 0 ? (
          <p className="text-body text-text-3 text-center py-xl">No assigned tasks to display.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 60)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="todo" stackId="a" fill={STATUS_COLORS.todo} name="To Do" />
              <Bar dataKey="in_progress" stackId="a" fill={STATUS_COLORS.in_progress} name="In Progress" />
              <Bar dataKey="review" stackId="a" fill={STATUS_COLORS.review} name="Review" />
              <Bar dataKey="blocked" stackId="a" fill={STATUS_COLORS.blocked} name="Blocked" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Overload alerts */}
      {chartData.filter(d => d.active > OVERLOAD_THRESHOLD).length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-md space-y-sm">
          <h4 className="text-body font-medium text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Overloaded Team Members
          </h4>
          {chartData.filter(d => d.active > OVERLOAD_THRESHOLD).map(d => (
            <div key={d.name} className="flex items-center justify-between">
              <span className="text-body">{d.name}</span>
              <Badge variant="outline" className="text-destructive border-destructive/30">{d.active} active tasks</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Unassigned */}
      {unassigned.length > 0 && (
        <div className="bg-surface rounded-lg border p-md">
          <h4 className="text-body font-medium mb-sm">Unassigned Tasks ({unassigned.length})</h4>
          <div className="space-y-xs">
            {unassigned.slice(0, 10).map(t => (
              <div key={t.id} className="flex items-center justify-between p-sm rounded bg-background border">
                <span className="text-body">{t.title}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize text-xs">{t.priority}</Badge>
                  {t.due_date && <span className="text-caption text-text-3">{t.due_date}</span>}
                </div>
              </div>
            ))}
            {unassigned.length > 10 && <p className="text-caption text-text-3">+{unassigned.length - 10} more</p>}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-md flex-wrap">
        {Object.entries(STATUS_COLORS).filter(([k]) => k !== 'done').map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-caption capitalize">{status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
