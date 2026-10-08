import type { SupabaseClient } from '@supabase/supabase-js';
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { requireAuth } from '../src/middleware/requireAuth';

/** Stands in for Supabase Auth: only the token "good-token" belongs to a user. */
const fakeSupabase = {
  auth: {
    getUser: async (token: string) =>
      token === 'good-token'
        ? { data: { user: { id: 'user-1' } }, error: null }
        : { data: { user: null }, error: new Error('invalid JWT') },
  },
} as unknown as SupabaseClient;

function appWith(supabase: SupabaseClient | null) {
  const app = express();
  app.get('/me', requireAuth(supabase), (_req, res) => {
    res.json({ userId: res.locals.user.id });
  });
  return app;
}

describe('requireAuth', () => {
  it('lets a valid token through and exposes the user', async () => {
    const res = await request(appWith(fakeSupabase))
      .get('/me')
      .set('authorization', 'Bearer good-token');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: 'user-1' });
  });

  it('rejects a missing token', async () => {
    const res = await request(appWith(fakeSupabase)).get('/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });

  it('rejects an invalid token', async () => {
    const res = await request(appWith(fakeSupabase))
      .get('/me')
      .set('authorization', 'Bearer bad-token');
    expect(res.status).toBe(401);
  });

  it('answers 503 when Supabase is not configured', async () => {
    const res = await request(appWith(null)).get('/me').set('authorization', 'Bearer good-token');
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('auth_unavailable');
  });
});
