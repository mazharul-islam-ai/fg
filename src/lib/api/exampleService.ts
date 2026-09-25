/**
 * Example data-fetch pattern.
 * Prefer: service (lib/api) â React Query hook (hooks) â feature/page composition.
 */
import { supabase } from "@/integrations/supabase/client";

export async function fetchHealth(): Promise<{ ok: boolean }> {
  void supabase;
  return { ok: true };
}
