import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface NotesTabProps {
  projectId: string;
}

export function NotesTab({ projectId }: NotesTabProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const { data: notes } = useQuery({
    queryKey: ['notes', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createNote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('notes').insert({
        title: title || null,
        body,
        project_id: projectId,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes', projectId] });
      setAdding(false);
      setTitle('');
      setBody('');
      toast.success('Note added');
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, title, body }: { id: string; title: string; body: string }) => {
      const { error } = await supabase.from('notes').update({ title, body }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes', projectId] });
      setEditingId(null);
      toast.success('Note updated');
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes', projectId] });
      toast.success('Note deleted');
    },
  });

  return (
    <div className="space-y-md">
      {!adding && (
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Note
        </Button>
      )}

      {adding && (
        <div className="bg-surface rounded-md border p-md space-y-sm">
          <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Write your note..." value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          <div className="flex gap-sm">
            <Button size="sm" onClick={() => createNote.mutate()} disabled={!body.trim()}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => { setAdding(false); setTitle(''); setBody(''); }}>Cancel</Button>
          </div>
        </div>
      )}

      {!notes?.length && !adding ? (
        <p className="text-text-2 text-center py-lg">No notes yet. Add a note to keep track of important details.</p>
      ) : (
        <div className="space-y-xs">
          {notes?.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isEditing={editingId === note.id}
              onEdit={() => setEditingId(note.id)}
              onCancelEdit={() => setEditingId(null)}
              onSave={(t, b) => updateNote.mutate({ id: note.id, title: t, body: b })}
              onDelete={() => deleteNote.mutate(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: {
  note: any;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (title: string, body: string) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(note.title || '');
  const [body, setBody] = useState(note.body || '');

  if (isEditing) {
    return (
      <div className="bg-surface rounded-md border p-md space-y-sm">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
        <div className="flex gap-sm">
          <Button size="sm" onClick={() => onSave(title, body)}><Check className="h-3.5 w-3.5 mr-1" /> Save</Button>
          <Button size="sm" variant="outline" onClick={onCancelEdit}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-md border p-md group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {note.title && <p className="font-medium text-body">{note.title}</p>}
          <p className="text-body whitespace-pre-wrap mt-0.5">{note.body}</p>
          <p className="text-caption text-text-3 mt-1">
            {new Date(note.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}><Edit2 className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    </div>
  );
}
