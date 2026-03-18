import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

async function callGmailSync(action: string, body?: object) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke('gmail-sync', {
    body: { action, ...body },
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export function useGmailStatus() {
  return useQuery({
    queryKey: ['gmail-status'],
    queryFn: () => callGmailSync('status'),
    staleTime: 30_000,
  });
}

export function useGmailAuthUrl() {
  return useMutation({
    mutationFn: async () => {
      const result = await callGmailSync('auth-url');
      if (result?.url) {
        window.location.href = result.url;
      } else if (result?.error) {
        throw new Error(result.error);
      }
      return result;
    },
  });
}

export function useGmailSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => callGmailSync('sync'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emails'] });
      qc.invalidateQueries({ queryKey: ['gmail-status'] });
    },
  });
}

export function useGmailDisconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => callGmailSync('disconnect'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gmail-status'] });
    },
  });
}
