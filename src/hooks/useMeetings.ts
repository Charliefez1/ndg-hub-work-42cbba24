import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Meeting = Tables<'meetings'>;

const KEY = ['meetings'];

export function useMeetings(filters?: { projectId?: string; organisationId?: string }) {
  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: async () => {
      let q = supabase.from('meetings').select('*, organisations(name), projects(name), contacts(name)').order('scheduled_at', { ascending: false });
      if (filters?.projectId) q = q.eq('project_id', filters.projectId);
      if (filters?.organisationId) q = q.eq('organisation_id', filters.organisationId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: TablesInsert<'meetings'>) => {
      const { data, error } = await supabase.from('meetings').insert(m).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: TablesUpdate<'meetings'> & { id: string }) => {
      const { data, error } = await supabase.from('meetings').update(u).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('meetings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
