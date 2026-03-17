import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Project = Tables<'projects'>;

const KEY = ['projects'];

export function useProjects() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, organisations(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['project', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*, organisations(name)').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (project: TablesInsert<'projects'>) => {
      const { data, error } = await supabase.from('projects').insert(project).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'projects'> & { id: string }) => {
      const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['project', vars.id] });
    },
  });
}

// --- Edge Function hooks ---

interface ScaffoldProjectInput {
  organisationId: string;
  name: string;
  deliveries: Array<Record<string, unknown>>;
  intendedNeuroPhase: string;
  budget: number;
  startDate: string;
  endDate: string;
  notes?: string;
}

export function useScaffoldProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ScaffoldProjectInput) => {
      const { data, error } = await supabase.functions.invoke('scaffold-project', {
        body: input,
      });
      if (error) throw error;
      return data as { project: Project; deliveries: unknown[]; sessions: unknown[]; forms: unknown[] };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['deliveries'] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['forms'] });
    },
  });
}

interface AdvanceProjectStatusInput {
  projectId: string;
  newStatus: string;
}

export function useAdvanceProjectStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdvanceProjectStatusInput) => {
      const { data, error } = await supabase.functions.invoke('advance-project-status', {
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['project', vars.projectId] });
    },
  });
}
