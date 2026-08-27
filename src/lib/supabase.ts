import { createClient, type SupabaseClient } from "@supabase/supabase-js";

declare global {
  var __familySupabase: SupabaseClient | undefined;
  var __familySchemaReady: boolean | undefined;
}

// Deliberately not NEXT_PUBLIC_: every query runs on the server, so neither the
// URL nor the key is ever shipped to the browser bundle.
const url = () => process.env.SUPABASE_URL?.trim();

/**
 * A secret key is preferred — every query in this app runs on the server, so
 * the key is never sent to the browser and RLS can be locked to service_role.
 * Without one we fall back to the publishable key, which the migration's
 * policies allow.
 */
const key = () =>
  process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_PUBLISHABLE_KEY?.trim();

export function isSupabaseConfigured(): boolean {
  return Boolean(url() && key());
}

export function supabase(): SupabaseClient {
  if (globalThis.__familySupabase) return globalThis.__familySupabase;

  const projectUrl = url();
  const apiKey = key();
  if (!projectUrl || !apiKey) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  // No browser session to keep: this client only ever runs on the server.
  globalThis.__familySupabase = createClient(projectUrl, apiKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return globalThis.__familySupabase;
}

export type SetupStatus = "ready" | "unconfigured" | "no-schema";

/**
 * Cheap one-time probe so a missing .env.local or an unapplied migration shows
 * a page that says what to do, rather than an opaque 500.
 */
export async function setupStatus(): Promise<SetupStatus> {
  if (!isSupabaseConfigured()) return "unconfigured";
  if (globalThis.__familySchemaReady) return "ready";

  const { error } = await supabase().from("members").select("id").limit(1);
  if (error) {
    // PGRST205: table missing from the schema cache. 42P01: undefined_table.
    if (error.code === "PGRST205" || error.code === "42P01") return "no-schema";
    throw new Error(`Supabase is unreachable: ${error.message}`);
  }

  globalThis.__familySchemaReady = true;
  return "ready";
}
