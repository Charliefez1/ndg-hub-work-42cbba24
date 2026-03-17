import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useNotes, useCreateNote, useDeleteNote } from '@/hooks/useNotes';
import { Plus, Trash2, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface NotesPanelProps {
  projectId?: string;
}

export function NotesPanel({ projectId }: NotesPanelProps) {
  const { data: notes } = useNotes(projectId);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleAdd = async () => {
    if (!title.trim()) return;
    try {
      await createNote.mutateAsync({ title, body: body || null, project_id: projectId || null });
      toast.success('Note added');
      setTitle('');
      setBody('');
      setAdding(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteNote.mutateAsync(id);
    toast.success('Note deleted');
  };

  return (
    <div className="space-y-md">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAdding(!adding)}>
          <Plus className="h-4 w-4 mr-1" /> Add Note
        </Button>
      </div>

      {adding && (
        <div className="bg-surface rounded-md border p-md space-y-sm">
          <Input placeholder="Note title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Write your note…" value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
          <div className="flex gap-sm justify-end">
            <Button variant="outline" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={createNote.isPending}>Save</Button>
          </div>
        </div>
      )}

      {!notes?.length && !adding ? (
        <div className="text-center py-lg">
          <StickyNote className="h-8 w-8 text-text-3 mx-auto mb-2" />
          <p className="text-text-2 text-caption">No notes yet.</p>
        </div>
      ) : (
        notes?.map((note) => (
          <div key={note.id} className="bg-surface rounded-md border p-md">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-body">{note.title ?? 'Untitled'}</p>
                {note.body && <p className="text-caption text-text-2 mt-1 whitespace-pre-wrap">{note.body}</p>}
                <p className="text-caption text-text-3 mt-2">
                  {note.updated_at ? formatDistanceToNow(new Date(note.updated_at), { addSuffix: true }) : ''}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleDelete(note.id)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
