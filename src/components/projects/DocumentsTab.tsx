import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { FileText, Plus, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentsTabProps {
  projectId: string;
}

export function DocumentsTab({ projectId }: DocumentsTabProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const { data: documents } = useQuery({
    queryKey: ['documents', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', 'project')
        .eq('entity_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addDocument = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('documents').insert({
        name,
        url,
        entity_type: 'project',
        entity_id: projectId,
        uploaded_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents', projectId] });
      setDialogOpen(false);
      setName('');
      setUrl('');
      toast.success('Document added');
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents', projectId] });
      toast.success('Document removed');
    },
  });

  return (
    <div className="space-y-md">
      <Button size="sm" onClick={() => setDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-1" /> Add Document
      </Button>

      {!documents?.length ? (
        <div className="text-center py-lg">
          <FileText className="h-10 w-10 mx-auto text-text-3 mb-sm" strokeWidth={1.25} />
          <p className="text-text-2">No documents attached yet.</p>
        </div>
      ) : (
        <div className="space-y-xs">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-surface rounded-md border p-md flex items-center justify-between group">
              <div className="flex items-center gap-sm min-w-0">
                <FileText className="h-4 w-4 text-text-3 shrink-0" />
                <div className="min-w-0">
                  <p className="text-body font-medium truncate">{doc.name}</p>
                  <p className="text-caption text-text-3">
                    {new Date(doc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteDocument.mutate(doc.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
          <div className="space-y-md">
            <div>
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Project Proposal" />
            </div>
            <div>
              <Label>URL *</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex justify-end gap-sm">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => addDocument.mutate()} disabled={!name.trim() || !url.trim()}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
