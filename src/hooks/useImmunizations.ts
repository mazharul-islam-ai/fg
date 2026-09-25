import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ImmunizationPayload = {
  patient_id: string;
  vaccine_name_foreign: string;
  vaccine_name_us_cvx?: string | null;
  date_administered?: string | null;
  document_id?: string | null;
  extracted_data?: any;
  status?: 'pending_review' | 'reviewed' | 'evaluated';
};

export function useImmunizations(patientId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['immunizations', patientId ?? 'all'];

  const query = useQuery({
    queryKey,
    enabled: !!patientId,
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from('immunization_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('date_administered', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async (payload: ImmunizationPayload) => {
      const { data, error } = await supabase
        .from('immunization_records')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Immunization record created');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Failed to create immunization record');
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ImmunizationPayload> }) => {
      const { data, error } = await supabase
        .from('immunization_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Immunization record updated');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Failed to update immunization record');
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('immunization_records').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Immunization record deleted');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Failed to delete immunization record');
    },
  });

  const evaluate = useMutation({
    mutationFn: async (immunizationIds: string[] | { patientId: string }) => {
      // Accept either array of IDs or an object with patientId to trigger full patient evaluation.
      const body =
        Array.isArray(immunizationIds) ? { immunization_ids: immunizationIds } : { patient_id: (immunizationIds as any).patientId };
      const res = await supabase.functions.invoke('evaluate-ice', {
        body: JSON.stringify(body),
      });
      // supabase.functions.invoke returns a Response-like object; handle error cases
      if (!res || (res as any).status >= 400) {
        const text = await res.text().catch(() => 'Evaluation failed');
        throw new Error(text || 'Failed to evaluate ICE');
      }
      const json = await res.json().catch(() => null);
      // On success, invalidate and toast
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('ICE evaluation queued/completed');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('ICE evaluation failed');
    },
  });

  return {
    ...query,
    create,
    update,
    remove,
    evaluate,
  };
}
