/**
 * Auth routes: sign up and log in, backed by Supabase.
 */

import { Router } from 'express';
import { supabase } from '../lib/supabaseClient.js';

export const authRouter = Router();

/**
 * POST /api/auth/signup
 * Body: { email, password }
 * Returns: { user } on success
 */
authRouter.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase is not configured' });
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Supabase quietly "succeeds" instead of erroring when the email is
    // already registered (done on purpose, so signup can't be used to find
    // out which emails have accounts). The tell: identities comes back
    // empty instead of containing the new account.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return res.status(409).json({ error: 'Account already exists' });
    }

    res.status(201).json({ user: data.user });
  } catch (err) {
    console.error('POST /api/auth/signup', err);
    res.status(500).json({ error: 'Failed to sign up' });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { user, session } on success — session.access_token is what
 * proves who's logged in on future requests.
 */
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase is not configured' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({ user: data.user, session: data.session });
  } catch (err) {
    console.error('POST /api/auth/login', err);
    res.status(500).json({ error: 'Failed to log in' });
  }
});
