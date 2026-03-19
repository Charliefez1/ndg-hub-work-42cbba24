import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAIDailyCoach() {
  return useQuery({
    queryKey: ['ai-daily-coach'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('ai-daily-coach', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      return data as { message: string; stats: { active_tasks: number; overdue_tasks: number; focus_minutes_today: number; upcoming_deliveries: number } };
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 mins
    retry: 1,
  });
}
