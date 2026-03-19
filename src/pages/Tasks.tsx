import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTasks, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { Plus, CheckSquare, MoreHorizontal, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusBadgeClasses, formatStatus } from '@/lib/status-colors';

import { BoardView } from '@/components/tasks/BoardView';
import { ListView } from '@/components/tasks/ListView';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet';
import { FocusMode } from '@/components/tasks/FocusMode';
import { WorkloadView } from '@/components/tasks/WorkloadView';

const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done', 'blocked'];

type ViewType = 'board' | 'list' | 'table' | 'timeline' | 'calendar';

export default function Tasks() {
  const { data: tasks, isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [view, setView] = useState<ViewType>('board');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [focusTask, setFocusTask] = useState<any | null>(null);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateTask.mutateAsync({
        id,
        status,
        completed_at: status === 'done' ? new Date().toISOString() : null,
      });
    } catch (err: any) { toast.error(err.message); }
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const handleStartFocus = (task: any) => {
    setFocusTask(task);
  };

  const subtasksForSelected = selectedTask
    ? tasks?.filter(t => t.parent_task_id === selectedTask.id) || []
    : [];

  if (focusTask) {
    return <FocusMode task={focusTask} onClose={() => setFocusTask(null)} />;
  }

  return (
    <AppShell>
      <div className="space-y-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Tasks</h1>
          <div className="flex items-center gap-sm">
            <Tabs value={view} onValueChange={(v) => setView(v as ViewType)}>
              <TabsList className="h-8">
                {(['board', 'list', 'table', 'timeline', 'calendar'] as ViewType[]).map((v) => (
                  <TabsTrigger key={v} value={v} className="text-xs px-2 capitalize">{v}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Button onClick={() => setDialogOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> New Task</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-sm">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !tasks?.length ? (
          <div className="bg-surface rounded-lg border p-xl text-center space-y-md">
            <CheckSquare className="h-12 w-12 mx-auto text-text-3" strokeWidth={1.25} />
            <p className="text-body text-text-2">All clear! No tasks to show.</p>
            <Button onClick={() => setDialogOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> New Task</Button>
          </div>
        ) : view === 'board' ? (
          <BoardView tasks={tasks} onStatusChange={handleStatusChange} onTaskClick={handleTaskClick} onStartFocus={handleStartFocus} />
        ) : view === 'list' ? (
          <ListView tasks={tasks} onStatusChange={handleStatusChange} onDelete={(id) => deleteTask.mutateAsync(id)} onTaskClick={handleTaskClick} />
        ) : view === 'table' ? (
          <TableView tasks={tasks} onStatusChange={handleStatusChange} onDelete={(id) => deleteTask.mutateAsync(id)} onTaskClick={handleTaskClick} />
        ) : view === 'timeline' ? (
          <TimelineView tasks={tasks} onTaskClick={handleTaskClick} />
        ) : (
          <CalendarView tasks={tasks} onStatusChange={handleStatusChange} />
        )}
      </div>

      <CreateTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <TaskDetailSheet
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        subtasks={subtasksForSelected}
        onStartFocus={handleStartFocus}
      />
    </AppShell>
  );
}

function TableView({ tasks, onStatusChange, onDelete, onTaskClick }: { tasks: any[]; onStatusChange: (id: string, s: string) => void; onDelete: (id: string) => void; onTaskClick: (t: any) => void }) {
  const parentTasks = tasks.filter(t => !t.parent_task_id && !t.is_template);
  return (
    <div className="rounded-lg border bg-surface overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Subtasks</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {parentTasks.map((t) => {
            const subtaskCount = tasks.filter(s => s.parent_task_id === t.id).length;
            const doneCount = tasks.filter(s => s.parent_task_id === t.id && s.status === 'done').length;
            return (
              <TableRow key={t.id} className="cursor-pointer" onClick={() => onTaskClick(t)}>
                <TableCell className="font-medium">{t.title}</TableCell>
                <TableCell>{(t as any).projects?.name ?? '—'}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{t.priority}</Badge></TableCell>
                <TableCell>
                  <Select value={t.status} onValueChange={(v) => { onStatusChange(t.id, v); }}>
                    <SelectTrigger className="h-7 w-28" onClick={e => e.stopPropagation()}><SelectValue /></SelectTrigger>
                    <SelectContent>{TASK_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{formatStatus(s)}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{t.due_date ?? '—'}</TableCell>
                <TableCell>{subtaskCount > 0 ? `${doneCount}/${subtaskCount}` : '—'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={async (e) => { e.stopPropagation(); await onDelete(t.id); toast.success('Deleted'); }} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function TimelineView({ tasks, onTaskClick }: { tasks: any[]; onTaskClick: (t: any) => void }) {
  const today = new Date().toISOString().split('T')[0];
  const parentTasks = tasks.filter(t => !t.parent_task_id && !t.is_template);
  const withDates = parentTasks.filter((t) => t.due_date).sort((a, b) => a.due_date!.localeCompare(b.due_date!));
  const noDates = parentTasks.filter((t) => !t.due_date);

  const weeks: Record<string, typeof tasks> = {};
  for (const t of withDates) {
    const d = new Date(t.due_date!);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay() + 1);
    const key = weekStart.toISOString().split('T')[0];
    if (!weeks[key]) weeks[key] = [];
    weeks[key].push(t);
  }

  return (
    <div className="space-y-lg">
      {Object.entries(weeks).map(([weekStart, items]) => (
        <div key={weekStart}>
          <div className="flex items-center gap-sm mb-sm">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <h3 className="text-section-title">Week of {new Date(weekStart).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</h3>
          </div>
          <div className="ml-3 border-l-2 border-border pl-md space-y-xs">
            {items.map((t) => (
              <div
                key={t.id}
                className={`bg-surface rounded-md border p-sm cursor-pointer hover:shadow-sm ${t.due_date! < today && t.status !== 'done' ? 'border-destructive/30' : ''}`}
                onClick={() => onTaskClick(t)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-body font-medium">{t.title}</p>
                  <Badge className={getStatusBadgeClasses(t.status, 'task')}>{formatStatus(t.status)}</Badge>
                </div>
                <p className="text-caption text-text-3">{t.due_date} · {t.priority}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
      {noDates.length > 0 && (
        <div>
          <h3 className="text-section-title mb-sm">No Due Date</h3>
          <div className="space-y-xs">
            {noDates.map((t) => (
              <div key={t.id} className="bg-surface rounded-md border p-sm cursor-pointer hover:shadow-sm" onClick={() => onTaskClick(t)}>
                <div className="flex items-center justify-between">
                  <p className="text-body font-medium">{t.title}</p>
                  <Badge className={getStatusBadgeClasses(t.status, 'task')}>{formatStatus(t.status)}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarView({ tasks, onStatusChange }: { tasks: any[]; onStatusChange: (id: string, s: string) => void }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const today = new Date();
  const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;

  const parentTasks = tasks.filter(t => !t.parent_task_id && !t.is_template);
  const tasksByDate: Record<string, typeof tasks> = {};
  for (const t of parentTasks) {
    if (t.due_date) {
      if (!tasksByDate[t.due_date]) tasksByDate[t.due_date] = [];
      tasksByDate[t.due_date].push(t);
    }
  }

  const todayStr = today.toISOString().split('T')[0];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-sm">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setMonthOffset((o) => o - 1)}>Prev</Button>
        <h3 className="text-section-title">{viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h3>
        <Button variant="outline" size="sm" onClick={() => setMonthOffset((o) => o + 1)}>Next</Button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {dayNames.map((d) => (
          <div key={d} className="bg-surface-2 p-2 text-center text-overline">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`pad-${i}`} className="bg-background min-h-[80px] p-1" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTasks = tasksByDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          return (
            <div key={day} className={`bg-surface min-h-[80px] p-1 ${isToday ? 'ring-2 ring-primary ring-inset' : ''}`}>
              <span className={`text-caption ${isToday ? 'text-primary font-bold' : 'text-text-3'}`}>{day}</span>
              <div className="space-y-px mt-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer ${t.status === 'done' ? 'bg-success/10 text-success line-through' : 'bg-primary/10 text-primary'}`}
                    onClick={() => onStatusChange(t.id, t.status === 'done' ? 'todo' : 'done')}
                    title={t.title}
                  >
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 3 && <span className="text-xs text-text-3 px-1">+{dayTasks.length - 3} more</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
