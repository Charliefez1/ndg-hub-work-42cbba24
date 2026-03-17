import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Form = Tables<'forms'>;
export type FormResponse = Tables<'form_responses'>;

export function useForms() {
  return useQuery({
    queryKey: ['forms'],
    queryFn: async () => {
      const { data, error } = await supabase.from('forms').select('*, projects(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useForm(id: string | undefined) {
  return useQuery({
    queryKey: ['form', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('forms').select('*').eq('id', id!).single();
      if (error) throw error;
      return data as Form;
    },
  });
}

export function useFormResponses(formId: string | undefined) {
  return useQuery({
    queryKey: ['form_responses', formId],
    enabled: !!formId,
    queryFn: async () => {
      const { data, error } = await supabase.from('form_responses').select('*').eq('form_id', formId!).order('submitted_at', { ascending: false });
      if (error) throw error;
      return data as FormResponse[];
    },
  });
}

export function useCreateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: TablesInsert<'forms'>) => {
      const { data, error } = await supabase.from('forms').insert(form).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forms'] }),
  });
}

export function useUpdateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: TablesUpdate<'forms'> & { id: string }) => {
      const { data, error } = await supabase.from('forms').update(u).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['forms'] });
      qc.invalidateQueries({ queryKey: ['form', v.id] });
    },
  });
}

export function useDeleteForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('forms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forms'] }),
  });
}

export function useSubmitFormResponse() {
  return useMutation({
    mutationFn: async (response: TablesInsert<'form_responses'>) => {
      const { data, error } = await supabase.from('form_responses').insert(response).select().single();
      if (error) throw error;
      return data;
    },
  });
}
