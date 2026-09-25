import { supabase } from "@/integrations/supabase/client";

/**
 * Immunization service helpers
 */

export async function fetchPatientImmunizations(patientId: string) {
  const { data, error } = await supabase
    .from("immunization_records")
    .select("*")
    .eq("patient_id", patientId)
    .order("date_administered", { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateImmunizationRecord(id: string, patch: Partial<any>) {
  const { data, error } = await supabase
    .from("immunization_records")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function triggerICEEvaluation(patientId: string, recordIds?: string[]) {
  // invoke edge function
  const res = await fetch(`${(import.meta.env.VITE_SUPABASE_URL || "")}/functions/v1/evaluate-ice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patient_id: patientId, immunization_record_ids: recordIds || null })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || "failed to invoke evaluate-ice");
  }

  return res.json();
}
