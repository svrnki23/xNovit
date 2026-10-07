/**
 * Checks the request for a valid Supabase login token (sent as
 * "Authorization: Bearer <token>") and attaches the real user to req.user.
 * Rejects with 401 if the token is missing or invalid.
 */

import { supabase } from '../lib/supabaseClient.js';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = data.user;
  next();
}
