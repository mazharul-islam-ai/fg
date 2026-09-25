import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Edge Function: auth-security-precheck
 * Checks recent failed login attempts and global lockout settings before a sign-in.
 *
 * Expects JSON body: { email: string, ip?: string }
 * Returns 200 with { ok: true } when allowed, or 403 with { error: 'locked' } when locked.
 *
 * Note: This is a pre-check and does not replace Supabase Auth flows.
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
    const email = String(body?.email || "").toLowerCase();
    const ip = body?.ip || null;

    if (!email) {
      return new Response(JSON.stringify({ error: "missing_email" }), { status: 400 });
    }

    // Load current global settings
    const { data: settings } = await supabase
      .from("auth_security_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    const lockout_threshold = settings?.lockout_threshold ?? 5;
    const lockout_window_minutes = settings?.lockout_window_minutes ?? 15;
    const lockout_duration_minutes = settings?.lockout_duration_minutes ?? 30;

    // Count failed_login events for this email in the window
    const since = new Date(Date.now() - lockout_window_minutes * 60 * 1000).toISOString();

    const { count } = await supabase
      .from("auth_security_events")
      .select("id", { count: "exact", head: true })
      .filter("email", "eq", email)
      .filter("event_type", "eq", "failed_login")
      .filter("created_at", "gt", since);

    if (typeof count === "number" && count >= lockout_threshold) {
      // Check if lockout still in effect by finding last failed login timestamp
      const { data: lastEvent } = await supabase
        .from("auth_security_events")
        .select("created_at")
        .filter("email", "eq", email)
        .filter("event_type", "eq", "failed_login")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastAt = lastEvent?.created_at ? new Date(lastEvent.created_at) : null;
      if (lastAt) {
        const unlockAt = new Date(lastAt.getTime() + lockout_duration_minutes * 60 * 1000);
        if (unlockAt > new Date()) {
          return new Response(JSON.stringify({ error: "account_locked", unlock_at: unlockAt.toISOString() }), { status: 403 });
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("auth-security-precheck error", err);
    return new Response(JSON.stringify({ error: "internal_error" }), { status: 500 });
  }
});
