import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Edge Function: evaluate-ice
 * Receives patient_id and will call the CDC ICE system to evaluate immunization schedules.
 *
 * Body: { patient_id: string, immunization_record_ids?: string[] }
 *
 * For this starter implementation, this function performs a simulated evaluation and stores
 * the result in immunization_records. Integrators should replace the simulation with actual
 * calls to their CDC ICE server.
 */

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!supabaseUrl || !serviceRole) {
      return new Response(JSON.stringify({ error: "server misconfigured" }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
    const body = await req.json().catch(() => ({}));
    const patient_id = body?.patient_id;
    const record_ids = body?.immunization_record_ids || null;

    if (!patient_id) {
      return new Response(JSON.stringify({ error: "missing_patient_id" }), { status: 400 });
    }

    // Fetch records to evaluate
    let q = supabase.from("immunization_records").select("*").eq("patient_id", patient_id);
    if (record_ids && Array.isArray(record_ids) && record_ids.length > 0) {
      q = q.in("id", record_ids);
    }
    const { data: records, error: recErr } = await q;

    if (recErr) {
      console.error("fetch records error", recErr);
      return new Response(JSON.stringify({ error: "db_error" }), { status: 500 });
    }

    // Simulated ICE evaluation result
    const evaluation = {
      evaluated_at: new Date().toISOString(),
      summary: "Simulated ICE evaluation. Integrate with CDC ICE for real results.",
      recommendations: [
        { vaccine: "DTaP", recommendation: "Administer 1 dose" }
      ]
    };

    // Update each record with an ICE evaluation result and status 'evaluated'
    const updates = (records || []).map((r: any) => ({
      id: r.id,
      ice_evaluation_result: evaluation,
      status: "evaluated"
    }));

    if (updates.length > 0) {
      const { error: updErr } = await supabase.from("immunization_records").upsert(updates, { returning: "minimal" });
      if (updErr) {
        console.error("update records error", updErr);
        return new Response(JSON.stringify({ error: "db_error" }), { status: 500 });
      }
    }

    // Audit
    await supabase.from("audit_logs").insert({
      action: "ice_evaluation",
      entity_type: "patient",
      entity_id: patient_id,
      metadata: { evaluated_records: updates.map((u) => u.id) }
    });

    return new Response(JSON.stringify({ ok: true, evaluation }), { status: 200 });
  } catch (err) {
    console.error("evaluate-ice error", err);
    return new Response(JSON.stringify({ error: "internal_error" }), { status: 500 });
  }
});
