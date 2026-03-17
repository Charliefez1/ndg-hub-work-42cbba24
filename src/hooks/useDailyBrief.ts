import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDailyBrief() {
  return useQuery({
    queryKey: ['daily-brief'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('daily-brief');
      if (error) throw error;
      return data;
    },
  });
}
