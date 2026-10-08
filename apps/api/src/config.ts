/**
 * Server configuration from environment variables: the process environment, plus
 * apps/api/.env in development (see .env.example).
 */
import { z } from 'zod';

/** `KEY=` with no value in .env means "not set". */
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);
const optionalSecret = z.preprocess(emptyToUndefined, z.string().min(1).optional());

const EnvSchema = z.object({
  NODE_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(['development', 'test', 'production']).default('development'),
  ),
  PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(65535).default(3000)),
  MAPBOX_TOKEN: optionalSecret,
  SUPABASE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
  BOOKING_AFFILIATE_ID: optionalSecret,
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

/** Load a .env file if there is one. Variables already set in the environment win. */
export function loadEnvFile(path: string): void {
  try {
    process.loadEnvFile(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}
