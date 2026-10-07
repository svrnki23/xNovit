/**
 * Requires a valid Supabase access token ("Authorization: Bearer <token>") and stores the
 * signed-in user in `res.locals.user`. Trip owners authenticate this way (build brief,
 * section 6); share tokens get their own check in M3.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RequestHandler } from 'express';
import { sendError } from '../lib/http';

export function requireAuth(supabase: SupabaseClient | null): RequestHandler {
  return async (req, res, next) => {
    if (!supabase) {
      sendError(res, 503, 'auth_unavailable', 'Sign-in is not configured on this server.');
      return;
    }

    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
    if (!token) {
      sendError(res, 401, 'unauthorized', 'Missing "Authorization: Bearer <token>" header.');
      return;
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      sendError(res, 401, 'unauthorized', 'Your sign-in token is invalid or has expired.');
      return;
    }

    res.locals.user = data.user;
    next();
  };
}
