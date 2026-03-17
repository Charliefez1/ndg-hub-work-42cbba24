import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Delivery = Tables<'deliveries'>;
export type Session = Tables<'sessions'>;
export type AgendaItem = Tables<'session_agenda_items'>;

export function useDeliveries(projectId?: string) {
  return useQuery({
    queryKey: ['deliveries', projectId],
    queryFn: async () => {
      let q = supabase.from('deliveries').select('*, organisations(name), services(name)').order('sort_order');
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useDelivery(id: string | undefined) {
  return useQuery({
    queryKey: ['delivery', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('deliveries').select('*, organisations(name), services(name), projects(name)').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: TablesInsert<'deliveries'>) => {
      const { data, error } = await supabase.from('deliveries').insert(d).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deliveries'] }),
  });
}

export function useUpdateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: TablesUpdate<'deliveries'> & { id: string }) => {
      const { data, error } = await supabase.from('deliveries').update(u).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['deliveries'] });
      qc.invalidateQueries({ queryKey: ['delivery', v.id] });
    },
  });
}

export function useSessions(deliveryId: string | undefined) {
  return useQuery({
    queryKey: ['sessions', deliveryId],
    enabled: !!deliveryId,
    queryFn: async () => {
      const { data, error } = await supabase.from('sessions').select('*').eq('delivery_id', deliveryId!).order('sort_order');
      if (error) throw error;
      return data as Session[];
    },
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: TablesInsert<'sessions'>) => {
      const { data, error } = await supabase.from('sessions').insert(s).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: TablesUpdate<'sessions'> & { id: string }) => {
      const { data, error } = await supabase.from('sessions').update(u).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sessions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useAgendaItems(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['agenda', sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase.from('session_agenda_items').select('*').eq('session_id', sessionId!).order('position');
      if (error) throw error;
      return data as AgendaItem[];
    },
  });
}

export function useCreateAgendaItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: TablesInsert<'session_agenda_items'>) => {
      const { data, error } = await supabase.from('session_agenda_items').insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agenda'] }),
  });
}

export function useUpdateAgendaItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: TablesUpdate<'session_agenda_items'> & { id: string }) => {
      const { data, error } = await supabase.from('session_agenda_items').update(u).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agenda'] }),
  });
}

export function useDeleteAgendaItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('session_agenda_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agenda'] }),
  });
}
