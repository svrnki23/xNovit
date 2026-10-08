# Decisions

Technical and product decisions, grouped by milestone. Each says what we chose, why, and where we checked. To change a decision, add a new entry that supersedes the old one instead of editing it.

## M0: Foundation (October 7, 2026)

### D1. Monorepo with npm workspaces; `@xnovit/core` is used from source

- **Decision:** One root `package.json` with `apps/*` and `packages/*` workspaces and a single lockfile. `@xnovit/core` exports `src/index.ts` directly, with no build step. The API runs it through `tsx` in development, and Metro (Expo) reads TypeScript source too. The API will be bundled for deployment in M3.
- **Why:** No build or watch step to forget during development, and imports behave the same on Windows and Mac.

### D2. TypeScript 6.0, not 7

- **Decision:** Pin `typescript ~6.0.3`.
- **Why:** TypeScript 7 (the native compiler) is `latest` on npm, but typescript-eslint 8.71 supports only `>=4.8.4 <6.1.0`. Revisit when typescript-eslint supports 7.
- **Source:** <https://typescript-eslint.io/users/dependency-versions/>, plus the `peerDependencies` of `typescript-eslint@8.71.1` on npm.

### D3. Node 24 LTS, with 22.13+ also allowed

- **Decision:** `.nvmrc` is `24`. `engines` is `^22.13.0 || ^24.0.0`, enforced with `engine-strict=true` in `.npmrc`.
- **Why:** ESLint 10 needs `^20.19 || ^22.13 || >=24` and Vitest 5 needs `^22.12 || ^24 || >=26`, so Node 23 (end of life) and Node 25 can't run the toolchain. `engine-strict` makes `npm install` fail with a clear message instead of failing in odd ways later.
- **Source:** <https://nodejs.org/en/about/previous-releases>, plus the `engines` field of `eslint@10` and `vitest@5` on npm.

### D4. Express 5

- **Decision:** Upgrade from Express 4 to 5 during the TypeScript conversion.
- **Why:** It's the current stable major version and forwards rejected promises from async handlers to the error handler, so we don't need wrappers. Almost every route was being rewritten anyway.
- **Source:** <https://expressjs.com/en/guide/migrating-5.html>

### D5. `process.loadEnvFile` instead of dotenv

- **Decision:** `apps/api/src/index.ts` loads `apps/api/.env` with Node's built-in `process.loadEnvFile()` when the file exists, then validates the environment with zod. An empty value (`KEY=`) means "not set".
- **Why:** One fewer dependency (dotenv 18 also prints banners). We checked on Node 20 and 22 that variables already set in the environment win over the file, which the CI smoke test relies on.
- **Source:** <https://nodejs.org/api/process.html#processloadenvfilepath>

### D6. Request schemas come in an input form and a resolved form, so defaults stay traceable

- **Decision:** `TripRequestInputSchema` makes every field that has a documented default optional. `resolveTripRequest()` fills those defaults in and returns one plain-English assumption per default it applied. Zod's `.default()` is not used for these fields.
- **Why:** Section 10 requires that every applied default appears in `Plan.assumptions`. `.default()` would apply defaults silently during parsing and lose that record.

### D7. Default values

- **Decision:** The family defaults are exactly those in brief sections 4 and 5.3. The vehicle defaults beyond the 15% reserve were carried over from the old calculators: 14-gallon tank, 25 mpg highway, 250-mile EV range, and a full tank or battery when no level is given. Each one appears in `assumptions` with a nudge to enter the real number.
- **Why:** The brief doesn't specify vehicle defaults. These keep the old behavior, but they are product decisions. **Founders: please confirm or change them** (see `docs/PROGRESS.md`).

### D8. How times are written

- **Decision:**
  - `etaUtc` and `createdAt` are ISO 8601 instants in UTC (`…Z`).
  - `localTime` and `totals.arriveAtLocal` are the same instant written with the local UTC offset (e.g. `2026-11-25T12:10:00-06:00`), next to an IANA `tz`.
  - Clock settings such as meal windows are `HH:mm`.
  - `departAt` must include an offset.
- **Why:** A single string carries the date, the time, and the offset, so day boundaries and time-zone crossings (golden trip 2) stay unambiguous.

### D9. Small adjustments to the section 4 contract (open to change until the M1 freeze)

- `TravelParty.bathroomIntervalMin` is required in the resolved form, because it is always filled in. It stays optional on input.
- `children`, `dogs`, `mealStyle` and `hotelBreakfastCountsAsBreakfast` are required on input, because the brief gives no default and we won't invent one.
- `PlaceOption` links must be `https`, which also blocks `javascript:` links on the share page. `sourceId` must be non-empty.
- `selectedOptionId` must match one of the item's options. A plan has at least one day.
- Sanity bounds on input:
  - Party: 1–12 adults and drivers, with drivers ≤ adults; children aged 0–17; 0–10 dogs.
  - Vehicle: tank ≤ 100 gal, mpg ≤ 150, EV range ≤ 1000 mi, reserve 0–50%.
  - Time: daily driving limit ≤ 24 h.
  - Ordering: meal windows and naps must end after they start.

### D10. Request bodies for the v1 API

- **Decision:** Defined in `packages/core/src/api.ts`:
  - departure options: `{ request, window: { from, to, stepMin? } }`, where the window is at most 24 h
  - replan: `{ location, at, fuelPercent? }`
  - item update: `{ status?, selectedOptionId?, locked? }`, at least one field required
  - events: `{ events: [...] }`, 1–100 events, with the trip id taken from the URL
  - share: `{ action: 'create' | 'revoke' }`
- **Why:** These are the shapes sections 5.9, 5.10 and 6 describe. Response shapes such as `DepartureOption` will be defined with the scheduler in M1.

### D11. Unbuilt endpoints answer 501; errors share one shape

- **Decision:** Every section 6 route is mounted. Until it's built, it validates its input and then answers `501 { error: "not_implemented", message }`. All errors are `{ error, message }`, plus `issues: [{ path, message }]` for validation failures. The health check lives at `/api/v1/health`, and the old `/health` was removed.
- **Why:** Honest failures, never placeholder data (section 0.7), while the shared schemas are still exercised end to end.

### D12. Lint rules enforce that core stays pure

- **Decision:** ESLint forbids, in `packages/core/src`:
  - `node:*` and other I/O imports
  - `fetch`, `process`, `crypto`
  - `Math.random`, `Date.now`, and `new Date()` with no argument
- **Why:** Section 3 says core does no I/O, and section 5 requires identical output for identical input. The scheduler must receive the current time and ids as inputs.

### D13. Fixes to the fuel math while porting it

- **Decision:**
  - Starting at or below the reserve means a stop at mile 0. The old code returned no stops at all in that case.
  - Stop miles round down.
  - Each next stop is measured from the mile where the car actually refilled.
- **Why:** The old code could plan a car below its reserve. A property test over 1,024 combinations now checks that fuel never drops below the reserve and that no stop comes more than a mile early.

### D14. The API never handles passwords

- **Decision:** Deleted the `/api/auth/signup` and `/api/auth/login` password routes. Kept `requireAuth`, which verifies a Supabase access token, as a factory for M3.
- **Why:** Section 6 says owners authenticate with a Supabase JWT, and M3 uses email magic links sent from the app straight to Supabase Auth.

### D15. Removed the `xNovit/` submodule pointer

- **Decision:** `git rm --cached xNovit` and added it to `.gitignore`.
- **Why:** It was a gitlink with no `.gitmodules` entry. Fresh clones got an empty folder, and CI checkout fails on it. The SwiftUI prototype still exists on the Mac where it was written; the app moves to `apps/mobile` (Expo) in M3.

### D16. LF line endings everywhere

- **Decision:** `.gitattributes` uses `* text=auto eol=lf`, and `.editorconfig` matches.
- **Why:** With plain `text=auto`, Windows checkouts get CRLF, and `prettier --check` fails there.

### D17. CI

- **Decision:** GitHub Actions on every push (plus manual runs), on Ubuntu, Windows and macOS: `npm ci`, lint, format check, typecheck, tests, then `npm run smoke`, which starts the API with tsx on a free port and checks routes over HTTP.
- **Why:** "`npm run dev` works on Windows and Mac" is a done criterion for M0, and only CI can check Windows for us. The repo is public, so macOS runner minutes are free.

### D18. CORS stays open until M3

- **Decision:** `cors()` with no origin restriction for now.
- **Why:** The share page doesn't have a domain yet. Restrict CORS to it when it's deployed in M3.

### D19. Which Supabase key the API uses (check in M3)

- **Decision:** For now, keep the earlier finding that `SUPABASE_SERVICE_ROLE_KEY` must be the legacy `service_role` key, not the newer secret key.
- **Why / follow-up:** Supabase has been moving projects to new API keys. Check their current docs before M3's migrations and auth work, and record the result here.
