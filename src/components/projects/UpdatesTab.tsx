import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Bot } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface UpdatesTabProps {
  projectId: string;
  projectName: string;
  projectStatus: string;
}

export function UpdatesTab({ projectId, projectName, projectStatus }: UpdatesTabProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [content, setContent] = useState('');

  const { data: updates } = useQuery({
    queryKey: ['project_updates', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_updates')
        .select('*, profiles:author_id(display_name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createUpdate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('project_updates').insert({
        project_id: projectId,
        author_id: user!.id,
        content,
        status_snapshot: { status: projectStatus },
        ai_generated: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project_updates', projectId] });
      setAdding(false);
      setContent('');
      toast.success('Update posted');
    },
  });

  return (
    <div className="space-y-md">
      {!adding && (
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Update
        </Button>
      )}

      {adding && (
        <div className="bg-surface rounded-md border p-md space-y-sm">
          <Textarea
            placeholder="Write a project update (supports markdown)..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
          />
          <div className="flex gap-sm">
            <Button size="sm" onClick={() => createUpdate.mutate()} disabled={!content.trim()}>
              Post Update
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setAdding(false); setContent(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!updates?.length && !adding ? (
        <p className="text-text-2 text-center py-lg">No updates yet. Post an update to keep stakeholders informed.</p>
      ) : (
        <div className="space-y-md">
          {updates?.map((update) => (
            <div key={update.id} className="bg-surface rounded-md border p-md">
              <div className="flex items-center gap-sm mb-sm">
                <span className="text-body font-medium">
                  {(update as any).profiles?.display_name || 'Unknown'}
                </span>
                {update.ai_generated && (
                  <Badge variant="outline" className="text-purple">
                    <Bot className="h-3 w-3 mr-1" /> AI
                  </Badge>
                )}
                {update.status_snapshot && (
                  <Badge variant="outline" className="text-xs">
                    {(update.status_snapshot as any).status?.replace(/_/g, ' ')}
                  </Badge>
                )}
                <span className="text-caption text-text-3 ml-auto">
                  {new Date(update.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="prose prose-sm max-w-none text-body">
                <ReactMarkdown>{update.content}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
