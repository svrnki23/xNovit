/**
 * Shared Supabase connection — import `supabase` from here anywhere
 * we need to read/write data or manage user accounts.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

// null if not configured, same pattern as the OpenAI client in aiService.js.
export const supabase = SUPABASE_URL && SUPABASE_SECRET_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)
  : null;
