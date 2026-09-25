import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import EmptyState from '@/components/layout/EmptyState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type Clinic = {
  id: string;
  name: string;
  slug: string;
  current_plan_id?: string | null;
};

export default function ClinicsPage() {
  const queryClient = useQueryClient();

  const clinicsQuery = useQuery({
    queryKey: ['superadmin', 'clinics'],
    queryFn: async () => {
      const { data, error } = await supabase.from<Clinic>('clinics').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; slug: string }) => {
      const { data, error } = await supabase.from('clinics').insert([payload]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'clinics'] });
      toast.success('Clinic created');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Failed to create clinic');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clinics').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'clinics'] });
      toast.success('Clinic deleted');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Failed to delete clinic');
    },
  });

  const { register, handleSubmit, reset, formState } = useForm<{ name: string; slug: string }>();

  const onCreate = handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values);
      reset();
    } catch (err) {
      // handled by mutation
    }
  });

  return (
    <PageLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Clinics</h1>
          <p className="text-sm text-muted-foreground">Manage clinics across the platform.</p>
        </header>

        <section className="mb-8">
          <h2 className="text-lg font-medium mb-2">Create Clinic</h2>
          <form onSubmit={onCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input {...register('name', { required: true })} placeholder="Clinic name" aria-label="Clinic name" />
            <Input {...register('slug', { required: true })} placeholder="slug (url-friendly)" aria-label="slug" />
            <div className="flex items-center space-x-2">
              <Button type="submit" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? 'Saving...' : 'Create'}
              </Button>
              <Button variant="ghost" onClick={() => reset()}>
                Reset
              </Button>
            </div>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-4">All Clinics</h2>

          {clinicsQuery.isLoading && <p>Loading clinics...</p>}
          {clinicsQuery.error && <p className="text-destructive">Failed to load clinics: {(clinicsQuery.error as any)?.message}</p>}

          {!clinicsQuery.isLoading && clinicsQuery.data && clinicsQuery.data.length === 0 ? (
            <EmptyState title="No clinics yet" description="Create the first clinic to get started." />
          ) : (
            <div className="space-y-3">
              {clinicsQuery.data?.map((clinic) => (
                <div key={clinic.id} className="p-3 border rounded-md flex justify-between items-center">
                  <div>
                    <div className="font-medium">{clinic.name}</div>
                    <div className="text-sm text-muted-foreground">/{clinic.slug}</div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        // navigate to clinic admin page
                        window.location.href = `/clinic/${clinic.slug}/patients`;
                      }}
                    >
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        if (!confirm('Delete this clinic? This action cannot be undone.')) return;
                        try {
                          await deleteMutation.mutateAsync(clinic.id);
                        } catch (err) {
                          // handled by mutation
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
