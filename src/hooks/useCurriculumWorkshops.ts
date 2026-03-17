import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type CurriculumWorkshop = Tables<'curriculum_workshops'>;

const KEY = ['curriculum-workshops'];

export function useCurriculumWorkshops() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('curriculum_workshops')
        .select('*, services(name)')
        .order('title');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCurriculumWorkshop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (workshop: TablesInsert<'curriculum_workshops'>) => {
      const { data, error } = await supabase
        .from('curriculum_workshops')
        .insert(workshop)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCurriculumWorkshop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('curriculum_workshops').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
