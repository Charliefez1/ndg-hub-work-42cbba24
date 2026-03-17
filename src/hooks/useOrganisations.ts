import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Organisation = Tables<'organisations'>;
export type Contact = Tables<'contacts'>;

const ORG_KEY = ['organisations'];
const CONTACT_KEY = ['contacts'];

export function useOrganisations() {
  return useQuery({
    queryKey: ORG_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('organisations').select('*').order('name');
      if (error) throw error;
      return data as Organisation[];
    },
  });
}

export function useOrganisation(id: string | undefined) {
  return useQuery({
    queryKey: ['organisation', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('organisations').select('*').eq('id', id!).single();
      if (error) throw error;
      return data as Organisation;
    },
  });
}

export function useContacts(organisationId: string | undefined) {
  return useQuery({
    queryKey: [...CONTACT_KEY, organisationId],
    enabled: !!organisationId,
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts').select('*').eq('organisation_id', organisationId!).order('is_primary', { ascending: false }).order('name');
      if (error) throw error;
      return data as Contact[];
    },
  });
}

export function useCreateOrganisation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (org: TablesInsert<'organisations'>) => {
      const { data, error } = await supabase.from('organisations').insert(org).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ORG_KEY }),
  });
}

export function useUpdateOrganisation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'organisations'> & { id: string }) => {
      const { data, error } = await supabase.from('organisations').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ORG_KEY }); },
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contact: TablesInsert<'contacts'>) => {
      const { data, error } = await supabase.from('contacts').insert(contact).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CONTACT_KEY }),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'contacts'> & { id: string }) => {
      const { data, error } = await supabase.from('contacts').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CONTACT_KEY }),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CONTACT_KEY }),
  });
}
