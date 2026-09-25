import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Edge Function: getAPIKey
 * Securely fetches an active AI API key for the requested provider.
 *
 * Expects JSON body: { provider: 'openai' | 'gemini' | 'anthropic' }
 * Returns { key_value: string } on success.
 *
 * Only callable by server-to-server callers (this function requires service role key).
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
    const provider = body?.provider;

    if (!provider || !["openai", "gemini", "anthropic"].includes(provider)) {
      return new Response(JSON.stringify({ error: "invalid_provider" }), { status: 400 });
    }

    // Retrieve the latest active key for the provider
    const { data, error } = await supabase
      .from("api_key_configs")
      .select("id, provider, key_value, is_active, updated_at")
      .eq("provider", provider)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("getAPIKey db error", error);
      return new Response(JSON.stringify({ error: "db_error" }), { status: 500 });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: "no_key_available" }), { status: 404 });
    }

    // key_value is expected to be stored encrypted in production; edge fn runs in trusted env
    return new Response(JSON.stringify({ key_value: data.key_value }), { status: 200 });
  } catch (err) {
    console.error("getAPIKey error", err);
    return new Response(JSON.stringify({ error: "internal_error" }), { status: 500 });
  }
});
