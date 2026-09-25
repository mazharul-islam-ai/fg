import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Edge Function: audit-log-writer
 * Writes audit logs to the audit_logs table.
 *
 * Expects JSON body: { user_id?: string, action: string, entity_type?: string, entity_id?: string, metadata?: object }
 * Requires SUPABASE_SERVICE_ROLE_KEY in environment.
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
    const { user_id, action, entity_type, entity_id, metadata } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: "missing_action" }), { status: 400 });
    }

    const { error } = await supabase.from("audit_logs").insert({
      user_id: user_id || null,
      action,
      entity_type: entity_type || null,
      entity_id: entity_id || null,
      metadata: metadata || null
    });

    if (error) {
      console.error("audit insert error", error);
      return new Response(JSON.stringify({ error: "db_error", details: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("audit-log-writer error", err);
    return new Response(JSON.stringify({ error: "internal_error" }), { status: 500 });
  }
});
