import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Email = Tables<'emails'>;

export function useEmails() {
  return useQuery({
    queryKey: ['emails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emails')
        .select('*, organisations(name), projects(name)')
        .order('received_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
}
