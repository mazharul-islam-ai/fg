import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { usePatients } from '@/hooks/usePatients';
import { useImmunizations } from '@/hooks/useImmunizations';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmptyState from '@/components/layout/EmptyState';

type RouteParams = {
  clinicSlug: string;
  patientId: string;
};

export default function PatientDetailPage() {
  const { patientId, clinicSlug } = useParams<RouteParams>();
  const navigate = useNavigate();

  // We don't strictly need clinicSlug for fetching patient in this minimal page,
  // but keep it for URL-aware actions.
  const { data: patients, isLoading: patientsLoading, error: patientsError } = usePatients(/* clinicId intentionally not required here */ undefined);
  // For robust behavior, we will fetch the single patient via direct supabase call if needed,
  // but reuse usePatients hook structure: find patient in list if available.
  const patient =
    (patients && Array.isArray(patients) && patientId && patients.find((p: any) => p.id === patientId)) ?? null;

  // Immunizations hook
  const {
    data: immunizations,
    isLoading: immunizationsLoading,
    error: immunizationsError,
    create: createImmunization,
    update: updateImmunization,
    remove: removeImmunization,
    evaluate: evaluateImmunization,
  } = useImmunizations(patientId);

  const { register, handleSubmit, reset, formState } = useForm<{ vaccine_name_foreign: string; date_administered?: string }>();

  const onCreate = handleSubmit(async (values) => {
    if (!patientId) {
      toast.error('Missing patient id');
      return;
    }
    try {
      await createImmunization.mutateAsync({
        patient_id: patientId,
        vaccine_name_foreign: values.vaccine_name_foreign,
        date_administered: values.date_administered ?? null,
        status: 'pending_review',
      });
      reset();
    } catch (err) {
      // createImmunization handles toast on error; nothing more needed
    }
  });

  if (patientsLoading || immunizationsLoading) {
    return (
      <PageLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4" />
            <div className="h-4 bg-muted rounded w-2/3 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (patientsError) {
    return (
      <PageLayout>
        <div className="p-6">
          <p className="text-destructive">Failed to load patient: {String((patientsError as any)?.message ?? patientsError)}</p>
        </div>
      </PageLayout>
    );
  }

  if (!patient) {
    return (
      <PageLayout>
        <div className="p-6">
          <EmptyState
            title="Patient not found"
            description="We couldn't find this patient. They may have been removed or the link is invalid."
            action={
              <Button onClick={() => navigate(`/clinic/${clinicSlug}/patients`)} variant="ghost">
                Back to patients
              </Button>
            }
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">DOB: {patient.date_of_birth ?? 'Unknown'}</p>
        </header>

        <section className="mb-8">
          <h2 className="text-lg font-medium mb-2">Add Immunization Record</h2>
          <form onSubmit={onCreate} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Input
              {...register('vaccine_name_foreign', { required: true })}
              placeholder="Vaccine name (from document)"
              aria-label="Vaccine name"
            />
            <Input {...register('date_administered')} type="date" aria-label="Date administered" />
            <div className="flex items-center space-x-2">
              <Button type="submit" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? 'Saving...' : 'Add'}
              </Button>
              <Button variant="ghost" onClick={() => reset()}>
                Reset
              </Button>
            </div>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-4">Immunization Records</h2>

          {immunizationsError && <p className="text-destructive">Failed to load records: {(immunizationsError as any)?.message}</p>}

          {!immunizations || immunizations.length === 0 ? (
            <EmptyState title="No records" description="This patient has no immunization records yet." />
          ) : (
            <div className="space-y-4">
              {immunizations.map((rec: any) => (
                <div key={rec.id} className="p-4 border rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{rec.vaccine_name_foreign}</div>
                      <div className="text-sm text-muted-foreground">Administered: {rec.date_administered ?? 'Unknown'}</div>
                      <div className="text-sm mt-2">
                        Status:{' '}
                        <span className="font-medium">{rec.status ?? 'unknown'}</span>
                      </div>
                      {rec.vaccine_name_us_cvx && (
                        <div className="text-sm text-muted-foreground mt-1">Mapped CVX: {rec.vaccine_name_us_cvx}</div>
                      )}
                      {rec.ice_evaluation_result && (
                        <div className="mt-2 text-sm">
                          <strong>ICE result:</strong> <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(rec.ice_evaluation_result)}</pre>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await evaluateImmunization.mutateAsync({ patientId });
                            } catch (err) {
                              // handled by hook
                            }
                          }}
                        >
                          Evaluate (ICE)
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            // simple toggle to mark as reviewed
                            try {
                              await updateImmunization.mutateAsync({ id: rec.id, updates: { status: rec.status === 'reviewed' ? 'pending_review' : 'reviewed' } });
                            } catch (err) {
                              // handled by hook
                            }
                          }}
                        >
                          {rec.status === 'reviewed' ? 'Unreview' : 'Mark reviewed'}
                        </Button>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (!confirm('Delete this immunization record?')) return;
                            try {
                              await removeImmunization.mutateAsync(rec.id);
                            } catch (err) {
                              // handled by hook
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
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
