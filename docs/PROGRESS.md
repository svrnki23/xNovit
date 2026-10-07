# Progress

## M0: Foundation and safety cleanup

**Branch:** `m0-foundation` · **Target:** Wednesday, October 14, 2026 · **Status:** done, waiting for review

### Done

- **Monorepo.** `backend/` moved to `apps/api` with `git mv`, so history is kept. npm workspaces with one root lockfile. Every script runs on Windows and Mac (`tsx watch`, no shell-specific syntax).
- **Invented data removed.** Deleted `aiService.js`, the trips, stops, emergency, rewards and password-auth routes, `iosTripCodec.js`, the Swift-specific `schemas.js`, the `openai` and `uuid` dependencies, and `OPENAI_API_KEY`. No route returns invented data. Unbuilt endpoints answer `501`.
- **API in TypeScript** on Express 5:
  - `GET /api/v1/health` works.
  - Every other section 6 endpoint validates its input against the core schemas, then answers `501 not_implemented`.
  - Errors are always `{ error, message }`.
  - The Mapbox client, Supabase client and `requireAuth` were ported.
- **`packages/core`:**
  - Every section 4 type as a zod schema.
  - `resolveTripRequest()`, which applies defaults and lists each one as a plain-English assumption.
  - v1 request body schemas.
  - The gas and EV range math, ported with three bug fixes (see DECISIONS D13).
  - Lint rules that keep core free of I/O, clocks and randomness.
- **CI** (`.github/workflows/ci.yml`): on every push, on Ubuntu, Windows and macOS, it runs lint, format check, typecheck and tests, then a smoke test that starts the API and checks routes over HTTP.
- **Docs:**
  - `.env.example` for the API (the only app so far).
  - `docs/DECISIONS.md` and this file.
  - The brief copied to `docs/XNOVIT_BUILD_BRIEF.md`.
  - A "superseded" note on all four older docs.
  - Rewritten root and API READMEs.
- **Repo hygiene:**
  - Stopped tracking `.DS_Store` and the broken `xNovit/` submodule pointer. The SwiftUI prototype stays on the Mac where it lives.
  - LF line endings everywhere.
  - Node 24 pinned.

### Checks (macOS, Node 22.14)

| Check                  | Result                                                |
| ---------------------- | ----------------------------------------------------- |
| `npm run lint`         | Pass                                                  |
| `npm run format:check` | Pass                                                  |
| `npm run typecheck`    | Pass (core and API)                                   |
| `npm test`             | 111 tests pass (72 core, 39 API), no network          |
| `npm run smoke`        | Pass                                                  |
| `npm run dev`          | Starts and serves `/api/v1/health` from the repo root |

CI runs the same checks on Windows, macOS and Linux with Node 24. Its result shows on the M0 pull request.

### Not done (as agreed)

- `apps/mobile` will be scaffolded at the start of M3, on whatever Expo SDK is current then.
- Supabase migrations will be proposed in the M1 plan. The live Supabase project was not touched.
- `fixtures/` will be created in M1, when the Mapbox responses for the golden trips are recorded.
- `npm run dev` on Windows is checked by the CI smoke test, not by hand.

### What the founders need to do

1. **Switch to Node 24 LTS on both machines.** Node 23 can't run ESLint 10 or Vitest 5, and `npm install` will refuse to run on it.
   - Mac (nvm): `nvm install 24`, then `nvm use 24`.
   - Windows: nvm-windows or the installer from nodejs.org.
   - Then run `npm install` from the repo root.
2. **Clean up the old `backend/` folder after pulling.** Git won't delete untracked files, so a local `backend/` folder may still hold `node_modules` or a `.env`.
   - If you had `backend/.env`, move it to `apps/api/.env` and delete its `OPENAI_API_KEY` line.
   - Then delete what's left of `backend/`.
3. **Windows, once: get LF line endings.** Re-check out the files, or `npm run format:check` will complain about CRLF. Commit or stash any work first, then run `git rm -r --cached .` followed by `git reset --hard`. A fresh clone works too.
4. **Coordinate branches.**
   - Don't merge commit `d6250d8` on `komalschanges` (saved trips in Supabase). M0 replaced that route, and section 7 defines a different `trips` table.
   - Start any new backend work from `main` after the M0 pull request is merged.
5. **Optional cleanup in Supabase.** The live `rewards` and `trips` tables are no longer used by any code. Dropping them is up to you.
6. **Please review before M1 freezes the contract:**
   - **D7:** vehicle defaults carried over from the old code (14 gal, 25 mpg, 250-mile EV range, full tank when no level is given).
   - **D9:** small adjustments to the section 4 contract.
   - **D10:** the API request body shapes.

### Accounts and keys (brief section 13)

Claude can't create accounts or enter credentials. Put keys in `apps/api/.env` (never commit it).

| Item                                               | Needed by                           | Notes                                                                                                      |
| -------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Mapbox account + access token** → `MAPBOX_TOKEN` | **M1 (next)**                       | Needed to record the golden-trip route fixtures at the start of M1. Restrict the token to the APIs we use. |
| Supabase project (URL, anon key, service role key) | M3 (M1 for migrations, if possible) | The service role key goes only in the API's environment, never in the app.                                 |
| Hosting for the API and web share page             | M3                                  | For example Vercel for the web export, plus Vercel, Render or Fly.io for the API.                          |
| Expo account + EAS                                 | M3                                  | Needed for the `@rnmapbox/maps` development build.                                                         |
| Booking.com affiliate application → affiliate id   | M4                                  | Approval can take time; apply now. Links work without it but don't earn commission.                        |
| Overpass                                           | M2                                  | No account needed. The public instance is fine for the pilot with caching; we'll respect its usage policy. |
| Apple Developer account                            | Only if TestFlight is wanted        | Not needed for the web-link pilot.                                                                         |
| NWS contact email (User-Agent) and NREL API key    | After the pilot                     | Only for the stretch features.                                                                             |

### Coming up in the M1 plan

These questions will be raised when the M1 plan is posted, not answered now:

- **Mapbox Geocoding.** The ported client uses the legacy v5 endpoint. Check whether to move to v6, and Mapbox's terms for showing Directions results.
- **EV charging time.** Section 5.4 says EV charge dwell comes "from the EV math", but the old math has no charging-time model, so it needs a rule.
- **Time zones.** Choose an offline lat/lng → time-zone library to use with Luxon.
- **Determinism.** The scheduler will take `now` and an id generator as inputs (see D12).
- **Saving plans.** Decide whether `POST /plans` saves to Supabase in M1 or only returns the plan until M3.
