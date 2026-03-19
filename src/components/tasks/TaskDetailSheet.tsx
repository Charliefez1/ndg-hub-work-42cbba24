import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useUpdateTask, useCreateTask, useDeleteTask } from '@/hooks/useTasks';
import { useTaskComments, useCreateTaskComment } from '@/hooks/useTaskComments';
import { useAuth } from '@/hooks/useAuth';
import { getStatusBadgeClasses, formatStatus } from '@/lib/status-colors';
import { MessageSquare, Plus, Trash2, Clock, Send, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done', 'blocked'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

interface TaskDetailSheetProps {
  task: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtasks?: any[];
  onStartFocus?: (task: any) => void;
}

export function TaskDetailSheet({ task, open, onOpenChange, subtasks = [], onStartFocus }: TaskDetailSheetProps) {
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const { user } = useAuth();
  const { data: comments, isLoading: commentsLoading } = useTaskComments(task?.id ?? null);
  const createComment = useCreateTaskComment();
  const [commentText, setCommentText] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);

  if (!task) return null;

  const handleStatusChange = async (status: string) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        status,
        completed_at: status === 'done' ? new Date().toISOString() : null,
      });
    } catch (err: any) { toast.error(err.message); }
  };

  const handlePriorityChange = async (priority: string) => {
    try { await updateTask.mutateAsync({ id: task.id, priority }); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !user) return;
    try {
      await createComment.mutateAsync({ task_id: task.id, content: commentText.trim(), user_id: user.id });
      setCommentText('');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    try {
      await createTask.mutateAsync({
        title: newSubtaskTitle.trim(),
        parent_task_id: task.id,
        project_id: task.project_id,
        priority: 'medium',
      });
      setNewSubtaskTitle('');
      setShowAddSubtask(false);
      toast.success('Subtask added');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync(task.id);
      onOpenChange(false);
      toast.success('Task deleted');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left pr-8">{task.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-md mt-md">
          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-sm">
            <div>
              <label className="text-caption text-text-3 mb-1 block">Status</label>
              <Select value={task.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{formatStatus(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-caption text-text-3 mb-1 block">Priority</label>
              <Select value={task.priority || 'medium'} onValueChange={handlePriorityChange}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Meta */}
          <div className="space-y-xs text-body">
            {task.projects?.name && (
              <div className="flex items-center gap-2 text-text-3">
                <ChevronRight className="h-3.5 w-3.5" />
                <span>{task.projects.name}</span>
              </div>
            )}
            {task.due_date && (
              <div className="flex items-center gap-2 text-text-3">
                <Clock className="h-3.5 w-3.5" />
                <span>{task.due_date}</span>
              </div>
            )}
            {task.recurrence && (
              <Badge variant="outline" className="capitalize">{task.recurrence}</Badge>
            )}
          </div>

          {task.description && (
            <p className="text-body text-text-2">{task.description}</p>
          )}

          {/* Focus button */}
          {onStartFocus && task.status !== 'done' && (
            <Button variant="outline" size="sm" onClick={() => { onStartFocus(task); onOpenChange(false); }}>
              <Clock className="h-4 w-4 mr-1" /> Focus on this
            </Button>
          )}

          <Separator />

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-sm">
              <h4 className="text-section-title text-sm">Subtasks ({subtasks.length})</h4>
              <Button variant="ghost" size="sm" onClick={() => setShowAddSubtask(!showAddSubtask)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
            {showAddSubtask && (
              <div className="flex gap-2 mb-sm">
                <Input
                  placeholder="Subtask title..."
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                  className="h-8"
                />
                <Button size="sm" onClick={handleAddSubtask} className="h-8">Add</Button>
              </div>
            )}
            <div className="space-y-1">
              {subtasks.map(st => (
                <div key={st.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50">
                  <button
                    onClick={() => updateTask.mutateAsync({
                      id: st.id,
                      status: st.status === 'done' ? 'todo' : 'done',
                      completed_at: st.status === 'done' ? null : new Date().toISOString(),
                    })}
                    className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${st.status === 'done' ? 'bg-success border-success' : 'border-text-3'}`}
                  />
                  <span className={`text-body text-sm flex-1 ${st.status === 'done' ? 'line-through text-text-3' : ''}`}>
                    {st.title}
                  </span>
                  <Badge className={`${getStatusBadgeClasses(st.status, 'task')} text-xs`}>
                    {formatStatus(st.status)}
                  </Badge>
                </div>
              ))}
              {subtasks.length === 0 && !showAddSubtask && (
                <p className="text-caption text-text-3">No subtasks yet</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Comments */}
          <div>
            <h4 className="text-section-title text-sm mb-sm flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" /> Comments
            </h4>
            <div className="space-y-sm max-h-[300px] overflow-y-auto">
              {commentsLoading ? (
                <p className="text-caption text-text-3">Loading...</p>
              ) : comments?.length === 0 ? (
                <p className="text-caption text-text-3">No comments yet</p>
              ) : comments?.map((c: any) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-xs">
                      {(c.profiles?.display_name || '?')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-caption font-medium">{c.profiles?.display_name || 'Unknown'}</span>
                      <span className="text-caption text-text-3">
                        {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-body text-sm">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-sm">
              <Input
                placeholder="Add a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                className="h-8"
              />
              <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()} className="h-8">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Delete */}
          <Button variant="outline" size="sm" className="text-destructive" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Task
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
