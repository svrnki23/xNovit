/**
 * xNovit API entry point.
 * Every place shown to a user must come from a real data source (build brief, section 0.7).
 */
import { fileURLToPath } from 'node:url';
import { createApp } from './app';
import { loadEnv, loadEnvFile } from './config';

loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)));
const env = loadEnv();

const server = createApp().listen(env.PORT, (error) => {
  if (error) {
    console.error(`Could not start the xNovit API: ${error.message}`);
    process.exit(1);
  }
  const address = server.address();
  const port = typeof address === 'object' && address !== null ? address.port : env.PORT;
  console.log(`xNovit API listening on http://localhost:${port}/api/v1/health`);

  if (!env.MAPBOX_TOKEN) {
    console.log('MAPBOX_TOKEN is not set: routing and geocoding are off (needed from M1).');
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('Supabase is not configured: sign-in and saved trips are off (needed from M3).');
  }
});
