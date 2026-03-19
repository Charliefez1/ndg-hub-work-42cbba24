import { Badge } from '@/components/ui/badge';
import { CheckSquare, ChevronDown, ChevronRight } from 'lucide-react';
import { getStatusBadgeClasses } from '@/lib/status-colors';
import { useState } from 'react';

interface ListViewProps {
  tasks: any[];
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onTaskClick: (task: any) => void;
}

export function ListView({ tasks, onStatusChange, onDelete, onTaskClick }: ListViewProps) {
  const today = new Date().toISOString().split('T')[0];
  const parentTasks = tasks.filter(t => !t.parent_task_id && !t.is_template);
  const subtasksByParent = tasks.reduce((acc: Record<string, any[]>, t) => {
    if (t.parent_task_id) {
      if (!acc[t.parent_task_id]) acc[t.parent_task_id] = [];
      acc[t.parent_task_id].push(t);
    }
    return acc;
  }, {});

  const sorted = [...parentTasks].sort((a, b) => {
    const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return (pOrder[a.priority as keyof typeof pOrder] ?? 2) - (pOrder[b.priority as keyof typeof pOrder] ?? 2);
  });

  return (
    <div className="space-y-xs">
      {sorted.map(t => (
        <ListItem
          key={t.id}
          task={t}
          today={today}
          subtasks={subtasksByParent[t.id] || []}
          onStatusChange={onStatusChange}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  );
}

function ListItem({ task: t, today, subtasks, onStatusChange, onTaskClick }: {
  task: any; today: string; subtasks: any[]; onStatusChange: (id: string, s: string) => void; onTaskClick: (task: any) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isOverdue = t.due_date && t.due_date < today && t.status !== 'done';
  const doneSubtasks = subtasks.filter(s => s.status === 'done').length;

  return (
    <div>
      <div
        className={`bg-surface rounded-md border p-md flex items-center gap-md cursor-pointer ${isOverdue ? 'border-destructive/30' : ''}`}
        onClick={() => onTaskClick(t)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onStatusChange(t.id, t.status === 'done' ? 'todo' : 'done'); }}
          className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${t.status === 'done' ? 'bg-success border-success text-white' : 'border-text-3 hover:border-primary'}`}
        >
          {t.status === 'done' && <CheckSquare className="h-3 w-3" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-body font-medium ${t.status === 'done' ? 'line-through text-text-3' : ''}`}>{t.title}</p>
          <div className="flex items-center gap-sm mt-0.5 flex-wrap">
            {t.projects?.name && <span className="text-caption text-text-3">{t.projects.name}</span>}
            {t.due_date && <span className={`text-caption ${isOverdue ? 'text-destructive font-medium' : 'text-text-3'}`}>{t.due_date}</span>}
            {subtasks.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="text-caption text-text-3 hover:text-text-2 flex items-center gap-0.5"
              >
                {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {doneSubtasks}/{subtasks.length}
              </button>
            )}
          </div>
        </div>
        <Badge variant="outline" className="capitalize text-xs shrink-0">{t.priority}</Badge>
        <Badge className={`${getStatusBadgeClasses(t.status, 'task')} shrink-0`}>{t.status.replace('_', ' ')}</Badge>
      </div>
      {expanded && subtasks.length > 0 && (
        <div className="ml-10 mt-1 space-y-1">
          {subtasks.map(st => (
            <div key={st.id} className="flex items-center gap-2 p-1.5 bg-surface rounded border">
              <button
                onClick={() => onStatusChange(st.id, st.status === 'done' ? 'todo' : 'done')}
                className={`w-4 h-4 rounded border shrink-0 ${st.status === 'done' ? 'bg-success border-success' : 'border-text-3'}`}
              />
              <span className={`text-body text-sm ${st.status === 'done' ? 'line-through text-text-3' : ''}`}>{st.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
