// Starts the API the way `npm run dev` does (tsx, without watch) on a free port, checks a
// few routes over real HTTP, then stops it. CI runs this on Windows, macOS, and Linux.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const apiDir = fileURLToPath(new URL('../apps/api/', import.meta.url));
const STARTUP_TIMEOUT_MS = 30_000;

const server = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
  cwd: apiDir,
  env: { ...process.env, PORT: '0' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
server.stderr.on('data', (chunk) => (output += chunk));

const baseUrl = await new Promise((resolve, reject) => {
  const timer = setTimeout(
    () => reject(new Error('API did not start in time.')),
    STARTUP_TIMEOUT_MS,
  );
  server.stdout.on('data', (chunk) => {
    output += chunk;
    const match = output.match(/listening on (http:\/\/localhost:\d+)/);
    if (match) {
      clearTimeout(timer);
      resolve(match[1]);
    }
  });
  server.on('exit', (code) => {
    clearTimeout(timer);
    reject(new Error(`API exited with code ${code} before it started.`));
  });
}).catch((error) => {
  console.error(`${error.message}\n${output}`);
  process.exit(1);
});

const checks = [
  ['GET', '/api/v1/health', undefined, 200],
  ['POST', '/api/v1/plans', {}, 400],
  ['POST', '/api/emergency/nearby', {}, 404],
];

let failed = false;
for (const [method, path, body, expected] of checks) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const ok = res.status === expected;
  failed ||= !ok;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${method} ${path} -> ${res.status} (expected ${expected})`);
}

server.kill();
process.exit(failed ? 1 : 0);
