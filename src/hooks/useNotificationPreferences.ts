import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface NotifPref {
  in_app: boolean;
  telegram: boolean;
}

export interface NotificationPreferences {
  task_assigned: NotifPref;
  delivery_reminder: NotifPref;
  invoice_overdue: NotifPref;
  form_response: NotifPref;
  project_status: NotifPref;
}

const DEFAULT_PREFS: NotificationPreferences = {
  task_assigned:     { in_app: true, telegram: false },
  delivery_reminder: { in_app: true, telegram: false },
  invoice_overdue:   { in_app: true, telegram: false },
  form_response:     { in_app: true, telegram: false },
  project_status:    { in_app: true, telegram: false },
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notification-preferences', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return ((data?.notification_preferences ?? DEFAULT_PREFS) as unknown) as NotificationPreferences;
    },
  });
}

export function useUpdateNotificationPreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: prefs as any })
        .eq('id', user!.id);
      if (error) throw error;
      return prefs;
    },
    onSuccess: (prefs) => {
      qc.setQueryData(['notification-preferences', user?.id], prefs);
    },
  });
}
