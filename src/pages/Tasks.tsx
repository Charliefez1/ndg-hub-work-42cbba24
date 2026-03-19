import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { Plus, CheckSquare, MoreHorizontal, Trash2, Check } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusBadgeClasses } from '@/lib/status-colors';

const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done', 'blocked'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

type ViewType = 'board' | 'list' | 'table' | 'timeline' | 'calendar';

const PRIORITY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  urgent: { bg: 'bg-destructive/10', text: 'text-destructive', dot: 'bg-destructive' },
  high: { bg: 'bg-[hsl(var(--orange)/0.1)]', text: 'text-[hsl(var(--orange))]', dot: 'bg-[hsl(var(--orange))]' },
  medium: { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning' },
  low: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

const STATUS_COLUMN_COLORS: Record<string, { accent: string; dot: string }> = {
  todo: { accent: 'border-t-muted-foreground', dot: 'bg-muted-foreground' },
  in_progress: { accent: 'border-t-[hsl(var(--info))]', dot: 'bg-[hsl(var(--info))]' },
  review: { accent: 'border-t-[hsl(var(--purple))]', dot: 'bg-[hsl(var(--purple))]' },
  done: { accent: 'border-t-[hsl(var(--success))]', dot: 'bg-[hsl(var(--success))]' },
  blocked: { accent: 'border-t-destructive', dot: 'bg-destructive' },
};

function PriorityBadge({ priority }: { priority: string }) {
  const colors = PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.low;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      <span className="capitalize">{priority}</span>
    </span>
  );
}

export default function Tasks() {
  const { data: tasks, isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [view, setView] = useState<ViewType>('board');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleStatusChange = async (id: string, status: string) => {
    try { await updateTask.mutateAsync({ id, status }); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Tasks</h1>
          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as ViewType)}>
              <TabsList className="h-8">
                {(['board', 'list', 'table', 'timeline', 'calendar'] as ViewType[]).map((v) => (
                  <TabsTrigger key={v} value={v} className="text-xs px-2.5 capitalize">{v}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New Task</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
        ) : !tasks?.length ? (
          <div className="bg-card rounded-xl border p-12 text-center space-y-3 shadow-sm">
            <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground" strokeWidth={1.25} />
            <p className="text-muted-foreground">All clear! No tasks to show.</p>
            <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New Task</Button>
          </div>
        ) : view === 'board' ? (
          <BoardView tasks={tasks} onStatusChange={handleStatusChange} />
        ) : view === 'list' ? (
          <ListView tasks={tasks} onStatusChange={handleStatusChange} onDelete={(id) => deleteTask.mutateAsync(id)} />
        ) : view === 'table' ? (
          <TableView tasks={tasks} onStatusChange={handleStatusChange} onDelete={(id) => deleteTask.mutateAsync(id)} />
        ) : view === 'timeline' ? (
          <TimelineView tasks={tasks} />
        ) : (
          <CalendarView tasks={tasks} onStatusChange={handleStatusChange} />
        )}
      </div>
      <CreateTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </AppShell>
  );
}

function BoardView({ tasks, onStatusChange }: { tasks: any[]; onStatusChange: (id: string, s: string) => void }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {TASK_STATUSES.map((status) => {
        const items = tasks.filter((t) => t.status === status);
        const colColors = STATUS_COLUMN_COLORS[status] ?? STATUS_COLUMN_COLORS.todo;
        return (
          <div key={status} className="min-w-[260px] w-[260px] shrink-0">
            <div className={`bg-card rounded-xl border border-t-[3px] ${colColors.accent} shadow-sm`}>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <span className={`h-2.5 w-2.5 rounded-full ${colColors.dot}`} />
                <span className="text-xs font-semibold uppercase tracking-wide capitalize">{status.replace('_', ' ')}</span>
                <span className="ml-auto text-xs text-muted-foreground font-medium bg-muted rounded-full px-2 py-0.5">{items.length}</span>
              </div>
              <div className="px-2 pb-2 space-y-1.5">
                {items.map((t) => (
                  <div key={t.id} className="bg-background rounded-xl border p-3 hover:shadow-md transition-all duration-200 cursor-pointer group">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    {t.parent_task_id && <p className="text-xs text-muted-foreground mt-0.5">Subtask</p>}
                    <div className="flex items-center justify-between mt-2">
                      <PriorityBadge priority={t.priority} />
                      {t.due_date && <span className={`text-xs font-medium ${t.due_date < new Date().toISOString().split('T')[0] && t.status !== 'done' ? 'text-destructive' : 'text-muted-foreground'}`}>{t.due_date}</span>}
                    </div>
                    {(t as any).projects?.name && <p className="text-xs text-muted-foreground mt-1.5 truncate">{(t as any).projects.name}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView({ tasks, onStatusChange, onDelete }: { tasks: any[]; onStatusChange: (id: string, s: string) => void; onDelete: (id: string) => void }) {
  const today = new Date().toISOString().split('T')[0];
  const sorted = [...tasks].sort((a, b) => {
    const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return (pOrder[a.priority as keyof typeof pOrder] ?? 2) - (pOrder[b.priority as keyof typeof pOrder] ?? 2);
  });

  return (
    <div className="space-y-1.5 stagger-in">
      {sorted.map((t) => {
        const isOverdue = t.due_date && t.due_date < today && t.status !== 'done';
        const isDone = t.status === 'done';
        return (
          <div key={t.id} className={`bg-card rounded-xl border p-3 flex items-center gap-3 shadow-xs hover:shadow-sm transition-shadow ${isOverdue ? 'border-destructive/30' : ''}`}>
            <button
              onClick={() => onStatusChange(t.id, isDone ? 'todo' : 'done')}
              className={`w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all duration-200 cursor-pointer ${isDone ? 'bg-success border-success' : 'border-border hover:border-primary hover:bg-primary/5'}`}
            >
              {isDone && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${isDone ? 'line-through text-muted-foreground' : ''}`}>{t.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {(t as any).projects?.name && <span className="text-xs text-muted-foreground">{(t as any).projects.name}</span>}
                {t.due_date && <span className={`text-xs font-medium ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>{t.due_date}</span>}
              </div>
            </div>
            <PriorityBadge priority={t.priority} />
            <Badge className={`${getStatusBadgeClasses(t.status, 'task')} shrink-0 text-xs`}>{t.status.replace('_', ' ')}</Badge>
          </div>
        );
      })}
    </div>
  );
}

function TableView({ tasks, onStatusChange, onDelete }: { tasks: any[]; onStatusChange: (id: string, s: string) => void; onDelete: (id: string) => void }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((t) => (
            <TableRow key={t.id} className="hover:bg-muted/30">
              <TableCell className="font-medium">{t.title}</TableCell>
              <TableCell className="text-muted-foreground">{(t as any).projects?.name ?? '—'}</TableCell>
              <TableCell><PriorityBadge priority={t.priority} /></TableCell>
              <TableCell>
                <Select value={t.status} onValueChange={(v) => onStatusChange(t.id, v)}>
                  <SelectTrigger className="h-7 w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-muted-foreground">{t.due_date ?? '—'}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={async () => { await onDelete(t.id); toast.success('Deleted'); }} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TimelineView({ tasks }: { tasks: any[] }) {
  const today = new Date().toISOString().split('T')[0];
  const withDates = tasks.filter((t) => t.due_date).sort((a, b) => a.due_date!.localeCompare(b.due_date!));
  const noDates = tasks.filter((t) => !t.due_date);

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
    <div className="space-y-6">
      {Object.entries(weeks).map(([weekStart, items]) => (
        <div key={weekStart}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <h3 className="text-sm font-semibold">Week of {new Date(weekStart).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</h3>
          </div>
          <div className="ml-3 border-l-2 border-border pl-4 space-y-1.5">
            {items.map((t) => (
              <div key={t.id} className={`bg-card rounded-xl border p-3 shadow-xs ${t.due_date! < today && t.status !== 'done' ? 'border-destructive/30' : ''}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{t.title}</p>
                  <Badge className={getStatusBadgeClasses(t.status, 'task')}>{t.status.replace('_', ' ')}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{t.due_date}</span>
                  <PriorityBadge priority={t.priority} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {noDates.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">No Due Date</h3>
          <div className="space-y-1.5">
            {noDates.map((t) => (
              <div key={t.id} className="bg-card rounded-xl border p-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{t.title}</p>
                  <Badge className={getStatusBadgeClasses(t.status, 'task')}>{t.status.replace('_', ' ')}</Badge>
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

  const tasksByDate: Record<string, typeof tasks> = {};
  for (const t of tasks) {
    if (t.due_date) {
      if (!tasksByDate[t.due_date]) tasksByDate[t.due_date] = [];
      tasksByDate[t.due_date].push(t);
    }
  }

  const todayStr = today.toISOString().split('T')[0];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setMonthOffset((o) => o - 1)}>Prev</Button>
        <h3 className="text-sm font-semibold">{viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h3>
        <Button variant="outline" size="sm" onClick={() => setMonthOffset((o) => o + 1)}>Next</Button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden shadow-sm">
        {dayNames.map((d) => (
          <div key={d} className="bg-muted/50 p-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">{d}</div>
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
            <div key={day} className={`bg-card min-h-[80px] p-1.5 ${isToday ? 'ring-2 ring-primary ring-inset' : ''}`}>
              <span className={`text-xs font-medium ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{day}</span>
              <div className="space-y-px mt-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer transition-colors ${t.status === 'done' ? 'bg-success/10 text-success line-through' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                    onClick={() => onStatusChange(t.id, t.status === 'done' ? 'todo' : 'done')}
                    title={t.title}
                  >
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 3 && <span className="text-xs text-muted-foreground px-1">+{dayTasks.length - 3}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CreateTaskDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const createTask = useCreateTask();
  const { data: projects } = useProjects();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask.mutateAsync({ title, description: description || null, project_id: projectId || null, priority, due_date: dueDate || null });
      toast.success('Task created');
      onOpenChange(false);
      setTitle(''); setDescription(''); setProjectId(''); setPriority('medium'); setDueDate('');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5"><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required className="h-10" /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>{projects?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10" /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createTask.isPending}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
