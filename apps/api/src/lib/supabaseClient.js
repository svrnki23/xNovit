/**
 * Shared Supabase connection — import `supabase` from here anywhere
 * we need to read/write data or manage user accounts.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
// Must be the legacy "service_role" key, not the newer "secret" key — only
// service_role reliably bypasses Row Level Security for our backend.
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// null if not configured.
export const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;
