# xNovit

_Tell us when you leave. We'll tell you where you'll eat, fuel, and sleep — and fix the plan when the day changes._

xNovit turns a long family drive into a timed schedule: fuel, meals inside local meal windows, bathroom and stretch breaks, and an overnight stop when needed. It plans around the people in the car and re-plans the rest of the day when things slip.

- **What to build, and the rules:** [docs/XNOVIT_BUILD_BRIEF.md](docs/XNOVIT_BUILD_BRIEF.md) (the source of truth)
- **Where we are:** [docs/PROGRESS.md](docs/PROGRESS.md)
- **Why things are the way they are:** [docs/DECISIONS.md](docs/DECISIONS.md)

## Repository layout

| Path            | What it is                                                                               |
| --------------- | ---------------------------------------------------------------------------------------- |
| `apps/api`      | Express API in TypeScript. See [apps/api/README.md](apps/api/README.md).                 |
| `packages/core` | Pure TypeScript shared by the API and the app: zod schemas, defaults, fuel math. No I/O. |
| `scripts`       | Cross-platform helper scripts (`smoke.mjs` starts the API and checks it over HTTP).      |
| `docs`          | The build brief, decisions, progress, and the older planning docs (kept for history).    |

Coming later: `apps/mobile` (Expo app and web share page, M3), `supabase` (migrations and seed), and `fixtures` (recorded API responses for tests, M1).

## Getting started (Windows or Mac)

You need **Node 24 LTS** (see `.nvmrc`); Node 22.13+ also works. Node 23 does not: ESLint and Vitest don't support it, and `npm install` will refuse to run.

From the repo root:

```bash
npm install
```

```bash
npm run dev
```

The API starts at <http://localhost:3000/api/v1/health>. It runs without any keys. To add them, copy `apps/api/.env.example` to `apps/api/.env` and fill in what you have.

## Scripts (run from the repo root)

| Command             | What it does                                                  |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | Start the API and restart it when files change                |
| `npm run check`     | Lint, format check, typecheck, and test: run before you push  |
| `npm run lint`      | ESLint                                                        |
| `npm run format`    | Format everything with Prettier                               |
| `npm run typecheck` | `tsc` in every workspace                                      |
| `npm test`          | Vitest in every workspace (never touches the network)         |
| `npm run smoke`     | Start the API on a free port and check a few routes over HTTP |

CI runs all of these on Windows, macOS, and Linux on every push.

## Ground rules (from the brief)

- **No invented places.** Every place shown to a user comes from a real data source and carries its `source` and `sourceId`. No LLM generates or fills in places, distances, times, or prices. If data is missing, we say so.
- **No secrets in code.** Only `.env.example` files with empty placeholders.
- **Unit tests never hit the network.** Real API responses are recorded once into `fixtures/` and replayed.
- **One branch per milestone**, small commits, pull requests into `main`. Never commit to `main` directly or rewrite history.
