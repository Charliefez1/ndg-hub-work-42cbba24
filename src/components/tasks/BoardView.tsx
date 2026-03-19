import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getStatusBadgeClasses, formatStatus } from '@/lib/status-colors';
import { Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done', 'blocked'];

interface BoardViewProps {
  tasks: any[];
  onStatusChange: (id: string, status: string) => void;
  onTaskClick: (task: any) => void;
  onStartFocus: (task: any) => void;
}

export function BoardView({ tasks, onStatusChange, onTaskClick, onStartFocus }: BoardViewProps) {
  const parentTasks = tasks.filter(t => !t.parent_task_id && !t.is_template);
  const subtasksByParent = tasks.reduce((acc: Record<string, any[]>, t) => {
    if (t.parent_task_id) {
      if (!acc[t.parent_task_id]) acc[t.parent_task_id] = [];
      acc[t.parent_task_id].push(t);
    }
    return acc;
  }, {});

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId;
    const taskId = result.draggableId;
    if (newStatus !== result.source.droppableId) {
      onStatusChange(taskId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-md overflow-x-auto pb-md">
        {TASK_STATUSES.map(status => {
          const items = parentTasks.filter(t => t.status === status);
          return (
            <div key={status} className="min-w-[260px] w-[260px] shrink-0">
              <div className="flex items-center gap-2 mb-sm">
                <Badge className={getStatusBadgeClasses(status, 'task')}>{formatStatus(status)}</Badge>
                <span className="text-caption text-text-3">{items.length}</span>
              </div>
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-xs min-h-[60px] rounded-md transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}
                  >
                    {items.map((t, index) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        index={index}
                        subtasks={subtasksByParent[t.id] || []}
                        onClick={() => onTaskClick(t)}
                        onStartFocus={() => onStartFocus(t)}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}

function TaskCard({ task, index, subtasks, onClick, onStartFocus }: {
  task: any; index: number; subtasks: any[]; onClick: () => void; onStartFocus: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'done';
  const doneSubtasks = subtasks.filter(s => s.status === 'done').length;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-surface rounded-md border p-sm transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/30' : 'hover:shadow-sm'} ${isOverdue ? 'border-destructive/30' : ''}`}
        >
          <div className="flex items-start gap-1">
            <div {...provided.dragHandleProps} className="pt-0.5 text-text-3 hover:text-text-2 cursor-grab">
              <GripVertical className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
              <p className="text-body font-medium truncate">{task.title}</p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <Badge variant="outline" className="capitalize text-xs">{task.priority}</Badge>
                {task.due_date && (
                  <span className={`text-caption ${isOverdue ? 'text-destructive font-medium' : 'text-text-3'}`}>
                    {task.due_date}
                  </span>
                )}
                {task.recurrence && (
                  <Badge variant="outline" className="text-xs">🔁 {task.recurrence}</Badge>
                )}
              </div>
              {task.projects?.name && (
                <p className="text-caption text-text-3 mt-1 truncate">{task.projects.name}</p>
              )}
            </div>
          </div>

          {/* Subtask summary */}
          {subtasks.length > 0 && (
            <div className="mt-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="flex items-center gap-1 text-caption text-text-3 hover:text-text-2"
              >
                {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {doneSubtasks}/{subtasks.length} subtasks
              </button>
              {expanded && (
                <div className="mt-1 ml-3 space-y-0.5">
                  {subtasks.map(st => (
                    <p key={st.id} className={`text-caption ${st.status === 'done' ? 'line-through text-text-3' : ''}`}>
                      {st.title}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick actions */}
          {task.status !== 'done' && (
            <div className="mt-1.5 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-text-3 hover:text-primary px-1.5"
                onClick={(e) => { e.stopPropagation(); onStartFocus(); }}
              >
                <Clock className="h-3 w-3 mr-1" /> Focus
              </Button>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
