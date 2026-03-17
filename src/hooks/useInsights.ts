import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useInsightsBusiness() {
  return useQuery({
    queryKey: ['insights-business'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('insights-business');
      if (error) throw error;
      return data;
    },
  });
}

export function useInsightsPersonal() {
  return useQuery({
    queryKey: ['insights-personal'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('insights-personal');
      if (error) throw error;
      return data;
    },
  });
}
