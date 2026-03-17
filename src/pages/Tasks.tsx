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
import { Plus, CheckSquare, MoreHorizontal, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusBadgeClasses } from '@/lib/status-colors';

const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done', 'blocked'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

type ViewType = 'board' | 'list' | 'table' | 'timeline' | 'calendar';

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
    <div className="flex gap-md overflow-x-auto pb-md">
      {TASK_STATUSES.map((status) => {
        const items = tasks.filter((t) => t.status === status);
        return (
          <div key={status} className="min-w-[240px] w-[240px] shrink-0">
            <div className="flex items-center gap-2 mb-sm">
              <Badge className={getStatusBadgeClasses(status, 'task')}>{status.replace('_', ' ')}</Badge>
              <span className="text-caption text-text-3">{items.length}</span>
            </div>
            <div className="space-y-xs">
              {items.map((t) => (
                <div key={t.id} className="bg-surface rounded-md border p-sm hover:shadow-sm transition-shadow">
                  <p className="text-body font-medium truncate">{t.title}</p>
                  {t.parent_task_id && <p className="text-caption text-text-3">Subtask</p>}
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="outline" className="capitalize text-xs">{t.priority}</Badge>
                    {t.due_date && <span className={`text-caption ${t.due_date < new Date().toISOString().split('T')[0] && t.status !== 'done' ? 'text-destructive' : 'text-text-3'}`}>{t.due_date}</span>}
                  </div>
                  {(t as any).projects?.name && <p className="text-caption text-text-3 mt-1 truncate">{(t as any).projects.name}</p>}
                </div>
              ))}
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
    <div className="space-y-xs">
      {sorted.map((t) => {
        const isOverdue = t.due_date && t.due_date < today && t.status !== 'done';
        return (
          <div key={t.id} className={`bg-surface rounded-md border p-md flex items-center gap-md ${isOverdue ? 'border-destructive/30' : ''}`}>
            <button
              onClick={() => onStatusChange(t.id, t.status === 'done' ? 'todo' : 'done')}
              className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${t.status === 'done' ? 'bg-success border-success text-white' : 'border-text-3 hover:border-primary'}`}
            >
              {t.status === 'done' && <CheckSquare className="h-3 w-3" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-body font-medium ${t.status === 'done' ? 'line-through text-text-3' : ''}`}>{t.title}</p>
              <div className="flex items-center gap-sm mt-0.5">
                {(t as any).projects?.name && <span className="text-caption text-text-3">{(t as any).projects.name}</span>}
                {t.due_date && <span className={`text-caption ${isOverdue ? 'text-destructive font-medium' : 'text-text-3'}`}>{t.due_date}</span>}
              </div>
            </div>
            <Badge variant="outline" className="capitalize text-xs shrink-0">{t.priority}</Badge>
            <Badge className={`${getStatusBadgeClasses(t.status, 'task')} shrink-0`}>{t.status.replace('_', ' ')}</Badge>
          </div>
        );
      })}
    </div>
  );
}

function TableView({ tasks, onStatusChange, onDelete }: { tasks: any[]; onStatusChange: (id: string, s: string) => void; onDelete: (id: string) => void }) {
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
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium">{t.title}</TableCell>
              <TableCell>{(t as any).projects?.name ?? '—'}</TableCell>
              <TableCell><Badge variant="outline" className="capitalize">{t.priority}</Badge></TableCell>
              <TableCell>
                <Select value={t.status} onValueChange={(v) => onStatusChange(t.id, v)}>
                  <SelectTrigger className="h-7 w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell>{t.due_date ?? '—'}</TableCell>
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

  // Group by week
  const weeks: Record<string, typeof tasks> = {};
  for (const t of withDates) {
    const d = new Date(t.due_date!);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay() + 1); // Monday
    const key = weekStart.toISOString().split('T')[0];
    if (!weeks[key]) weeks[key] = [];
    weeks[key].push(t);
  }

  return (
    <div className="space-y-lg">
      {Object.entries(weeks).map(([weekStart, items]) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return (
          <div key={weekStart}>
            <div className="flex items-center gap-sm mb-sm">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <h3 className="text-section-title">Week of {new Date(weekStart).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</h3>
            </div>
            <div className="ml-3 border-l-2 border-border pl-md space-y-xs">
              {items.map((t) => (
                <div key={t.id} className={`bg-surface rounded-md border p-sm ${t.due_date! < today && t.status !== 'done' ? 'border-destructive/30' : ''}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-body font-medium">{t.title}</p>
                    <Badge className={getStatusBadgeClasses(t.status, 'task')}>{t.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-caption text-text-3">{t.due_date} · {t.priority}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {noDates.length > 0 && (
        <div>
          <h3 className="text-section-title mb-sm">No Due Date</h3>
          <div className="space-y-xs">
            {noDates.map((t) => (
              <div key={t.id} className="bg-surface rounded-md border p-sm">
                <div className="flex items-center justify-between">
                  <p className="text-body font-medium">{t.title}</p>
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
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-indexed

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
    <div className="space-y-sm">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setMonthOffset((o) => o - 1)}>Prev</Button>
        <h3 className="text-section-title">
          {viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </h3>
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
        <form onSubmit={handleSubmit} className="space-y-md">
          <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-md">
            <div><Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>{projects?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          <div className="flex justify-end gap-sm">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createTask.isPending}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
