import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Invoice = Tables<'invoices'>;

const KEY = ['invoices'];

export function useInvoices() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, organisations(name), projects(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['invoice', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('invoices').select('*, organisations(name), projects(name), invoice_items(*, services(name))').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invoice: TablesInsert<'invoices'>) => {
      const { data, error } = await supabase.from('invoices').insert(invoice).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: TablesUpdate<'invoices'> & { id: string }) => {
      const { data, error } = await supabase.from('invoices').update(u).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['invoice', v.id] });
    },
  });
}

// --- Edge Function hooks ---

interface GenerateInvoiceInput {
  projectId: string;
  deliveryIds: string[];
}

export function useGenerateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: GenerateInvoiceInput) => {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: input,
      });
      if (error) throw error;
      return data as { invoice: Invoice; items: unknown[] };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSendInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId }: { invoiceId: string }) => {
      const { data, error } = await supabase.functions.invoke('send-invoice', {
        body: { invoiceId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMarkInvoicePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId }: { invoiceId: string }) => {
      const { data, error } = await supabase.functions.invoke('mark-invoice-paid', {
        body: { invoiceId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRecalculateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId }: { invoiceId: string }) => {
      const { data, error } = await supabase.functions.invoke('recalculate-invoice', {
        body: { invoiceId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['invoice', vars.invoiceId] });
    },
  });
}
