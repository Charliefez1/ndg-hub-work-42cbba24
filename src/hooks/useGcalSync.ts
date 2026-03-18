import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

async function callGcalSync(action: string, body?: object) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke('gcal-sync', {
    body: { action, ...body },
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export function useGcalStatus() {
  return useQuery({
    queryKey: ['gcal-status'],
    queryFn: () => callGcalSync('status'),
    staleTime: 30_000,
  });
}

export function useGcalAuthUrl() {
  return useMutation({
    mutationFn: async () => {
      const result = await callGcalSync('auth-url');
      if (result?.url) {
        window.location.href = result.url;
      } else if (result?.error) {
        throw new Error(result.error);
      }
      return result;
    },
  });
}

export function useGcalCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: string) => callGcalSync('create-event', { meetingId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}

export function useGcalDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: string) => callGcalSync('delete-event', { meetingId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}

export function useGcalDisconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => callGcalSync('disconnect'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gcal-status'] });
    },
  });
}
