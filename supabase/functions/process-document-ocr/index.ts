import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Edge Function: process-document-ocr
 * Triggered after a document upload to process OCR and initial extraction.
 *
 * Body: { document_id: string }
 *
 * NOTE: Full AI OCR/translation requires external provider keys and is environment-specific.
 * This function performs a minimal placeholder extraction to populate extracted_data so
 * the UI has something to show. Deployers should extend this to call getAPIKey and
 * the chosen AI provider to run OCR/NER/translation.
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
    const document_id = body?.document_id;

    if (!document_id) {
      return new Response(JSON.stringify({ error: "missing_document_id" }), { status: 400 });
    }

    // Load document and patient context
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .select("id, patient_id, file_name, uploaded_by")
      .eq("id", document_id)
      .maybeSingle();

    if (docErr || !doc) {
      console.error("document fetch error", docErr);
      return new Response(JSON.stringify({ error: "document_not_found" }), { status: 404 });
    }

    // Minimal placeholder extraction: in real deployment, call getAPIKey + external AI OCR.
    const extracted = {
      summary: `Placeholder extraction for ${doc.file_name}`,
      vaccines: [
        { vaccine_name_foreign: "BCG", date_administered: null },
      ],
      notes: "This record was auto-populated by placeholder OCR. Replace with real AI extraction integration."
    };

    // Insert a new immunization record linked to patient for review
    const { error: insErr } = await supabase.from("immunization_records").insert({
      patient_id: doc.patient_id,
      vaccine_name_foreign: extracted.vaccines[0].vaccine_name_foreign,
      date_administered: extracted.vaccines[0].date_administered,
      document_id: doc.id,
      extracted_data: extracted,
      status: "pending_review"
    });

    if (insErr) {
      console.error("insert immunization error", insErr);
      return new Response(JSON.stringify({ error: "db_error" }), { status: 500 });
    }

    // Write an audit log
    await supabase.from("audit_logs").insert({
      user_id: doc.uploaded_by || null,
      action: "document_processed",
      entity_type: "document",
      entity_id: doc.id,
      metadata: { note: "placeholder OCR used" }
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("process-document-ocr error", err);
    return new Response(JSON.stringify({ error: "internal_error" }), { status: 500 });
  }
});
