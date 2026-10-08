/**
 * Server-side Supabase client. It uses the service role key, which bypasses Row Level
 * Security, so it lives only in the API's environment and never in the app.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../config';

/**
 * Returns null when Supabase isn't configured, so the API still runs without it.
 * SUPABASE_SERVICE_ROLE_KEY must be the legacy "service_role" key, not the newer "secret"
 * key: only service_role reliably bypassed Row Level Security for us.
 */
export function createSupabaseAdmin(
  env: Pick<Env, 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'>,
): SupabaseClient | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
