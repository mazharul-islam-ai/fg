import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PatientPayload = {
  clinic_id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  parent_user_id?: string | null;
};

export function usePatients(clinicId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['patients', clinicId ?? 'all'];

  const query = useQuery({
    queryKey,
    enabled: !!clinicId,
    queryFn: async () => {
      if (!clinicId) return [];
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async (payload: PatientPayload) => {
      const { data, error } = await supabase
        .from('patients')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Patient created');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Failed to create patient');
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PatientPayload> }) => {
      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Patient updated');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Failed to update patient');
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Patient deleted');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Failed to delete patient');
    },
  });

  return {
    ...query,
    create,
    update,
    remove,
  };
}
