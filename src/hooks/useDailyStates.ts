import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type DailyState = Tables<'daily_states'>;

const KEY = ['daily-states'];

export function useDailyStates() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_states')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as DailyState[];
    },
  });
}

export function useTodayState(userId: string | undefined) {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: [...KEY, 'today', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_states')
        .select('*')
        .eq('user_id', userId!)
        .eq('date', today)
        .maybeSingle();
      if (error) throw error;
      return data as DailyState | null;
    },
  });
}

export function useUpsertDailyState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (state: TablesInsert<'daily_states'>) => {
      // Check if entry exists for this date
      const { data: existing } = await supabase
        .from('daily_states')
        .select('id')
        .eq('user_id', state.user_id)
        .eq('date', state.date ?? new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('daily_states')
          .update({
            energy_level: state.energy_level,
            focus_level: state.focus_level,
            mood: state.mood,
            notes: state.notes,
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('daily_states')
          .insert(state)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
