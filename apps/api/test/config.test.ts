import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/config';

describe('loadEnv', () => {
  it('applies defaults when nothing is set', () => {
    expect(loadEnv({})).toEqual({ NODE_ENV: 'development', PORT: 3000 });
  });

  it('treats empty values from .env.example as unset', () => {
    const env = loadEnv({
      PORT: '',
      NODE_ENV: '',
      MAPBOX_TOKEN: '',
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      BOOKING_AFFILIATE_ID: '',
    });
    expect(env).toEqual({ NODE_ENV: 'development', PORT: 3000 });
  });

  it('reads values that are set', () => {
    const env = loadEnv({
      PORT: '0',
      NODE_ENV: 'test',
      MAPBOX_TOKEN: 'pk.test',
      SUPABASE_URL: 'https://example.supabase.co',
    });
    expect(env).toMatchObject({
      PORT: 0,
      NODE_ENV: 'test',
      MAPBOX_TOKEN: 'pk.test',
      SUPABASE_URL: 'https://example.supabase.co',
    });
  });

  it('rejects an invalid port or URL', () => {
    expect(() => loadEnv({ PORT: 'eighty' })).toThrow(/PORT/);
    expect(() => loadEnv({ SUPABASE_URL: 'not a url' })).toThrow(/SUPABASE_URL/);
  });
});
