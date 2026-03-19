import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const KEY = ['task_comments'];

export function useTaskComments(taskId: string | null) {
  return useQuery({
    queryKey: [...KEY, taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*, profiles:user_id(display_name, avatar_url)')
        .eq('task_id', taskId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ task_id, content, user_id }: { task_id: string; content: string; user_id: string }) => {
      const { data, error } = await supabase
        .from('task_comments')
        .insert({ task_id, content, user_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: [...KEY, vars.task_id] }),
  });
}
