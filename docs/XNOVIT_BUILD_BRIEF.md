# xNovit — Build Brief (v1, October 7, 2026)

> **For Claude:** Read this entire file before writing any code. It replaces `docs/PRODUCT_SPECIFICATION.md` and `docs/PROPOSED_PLAN.md` as the source of truth for what to build next. Start with Section 0, then do **Milestone M0 only** and stop for review.

---

## 0. How to work on this project (read first)

You are building with a two-person student team. One founder develops on Windows, the other on Mac.

1. **One milestone at a time, in order.** Before coding a milestone, post a short plan: the files you'll touch, your approach, and any open questions. Wait for a go-ahead.
2. **At the end of each milestone:** run lint, typecheck, and tests, then update `docs/PROGRESS.md` with what's done, what isn't, and what the humans need to do. Stop and wait.
3. **Ask instead of inventing product decisions.** If this brief doesn't cover something, ask.
4. **Git hygiene:** one branch per milestone (`m0-foundation`, `m1-scheduler`, …), small focused commits, never commit directly to `main`, never force-push or rewrite history.
5. **No secrets in code.** Only `.env.example` files with placeholders. If a key is missing, fall back to recorded fixtures in development and tell the humans exactly what to create.
6. **You can't create third-party accounts or enter credentials.** List what the humans need (Section 13) and keep working with fixtures.
7. **Hard rule: no invented places.** Every restaurant, gas station, rest area, hotel, hospital, or address shown to a user must come from a real data source and carry its `source` and `sourceId`. No LLM may generate or "fill in" places, distances, times, or prices. If data is missing, show that it's missing.
8. **Unit tests never hit the network.** Record real API responses once into `/fixtures` and replay them.
9. **Third-party terms matter.** When unsure about an API's parameters, pricing, caching rules, attribution, or which map its results may be shown on, read the provider's current official docs and record the decision (with the link) in `docs/DECISIONS.md`.
10. **Prefer boring, well-maintained libraries.** Ask before adding any paid service.

---

## 1. What we're building and why

**Positioning:** *"Tell us when you leave. We'll tell you where you'll eat, fuel, and sleep — and fix the plan when the day changes."*

Other apps (Google Maps' Ask Maps, Roadtrippers, hotel-chain apps) help people **find places** along a route. xNovit manages **time** on long drives. It turns a route into a timed schedule, plans around the people in the car, and re-plans the rest of the day when things slip.

**Target user (only one for now):** families driving 6+ hours. Typically 2 adults plus kids, sometimes a dog. Not truckers, not RVs.

**The three jobs the MVP must do well:**

1. **Timed plan.** Route → schedule with fuel, meals (inside *local* meal windows), bathroom and stretch breaks, and an overnight stop when needed. Each stop has real place options and a one-line reason.
2. **Plan around the family.** Use kids' ages, nap windows, bathroom interval, pets, meal style, daily driving limit, and latest arrival time. Suggest the best departure time.
3. **Re-plan.** From the current location and time, recompute the rest of the trip, show what changed, and flag when tonight's hotel no longer fits.

**How it makes money (MVP):** hotel affiliate links for the overnight stop. Later: a per-trip pass or annual plan, then paid placement for highway businesses. **Don't build payments now.**

**The deadline that matters:** a hand-run pilot with 20–30 families driving for Thanksgiving (Thursday, November 26, 2026). The founders will create plans and text families a **share link** that opens in a phone browser. For the pilot, the web share page matters more than an App Store release.

---

## 2. Current state of the repo

**`backend/`** — Node/Express, JavaScript (ESM):

| File | Status | Action |
|---|---|---|
| `src/services/aiService.js` | Uses GPT to generate trips, rest stops, and emergency places. Without a key, returns the same fake trip every time. | **Delete.** |
| `src/routes/emergency.js` | Returns AI-invented hospitals, tow services, and police. Defaults to the center of the US when coordinates are missing. | **Delete.** |
| `src/routes/stops.js` | AI-generated "nearest rest" stops. | **Delete;** replaced by real data in M2/M4. |
| `src/routes/rewards.js` | One global in-memory points balance. | **Delete** (rewards are out of scope). |
| `src/routes/trips.js` | In-memory trip store; calls the AI service. | **Replace** with the v1 API (Section 6). |
| `src/services/mapboxService.js` | Real geocoding and routing, but `overview=false` (no geometry). | **Keep and extend.** |
| `src/lib/gasCalculator.js`, `evCalculator.js` | Real range math that returns mile markers. | **Port** into `packages/core` with tests. |
| `src/lib/iosTripCodec.js`, `schemas.js` | Swift-specific shapes. | **Replace** with shared zod schemas. |
| `src/lib/supabaseClient.js` | Supabase client, null if unconfigured. | **Keep** (move into the TS API). |
| `package.json` | The `dev` script uses `NODE_OPTIONS=...` syntax that fails on Windows. | **Fix** with cross-platform scripts. |

**No mobile app exists yet.** The README references an Xcode project that isn't in the repo.

**`docs/`** contains the old spec, workflows, tech stack, and `PROPOSED_PLAN.md`. Keep them for history, but add a note at the top of `PRODUCT_SPECIFICATION.md` and `PROPOSED_PLAN.md` pointing to this brief.

---

## 3. Target architecture

A monorepo using npm workspaces, which behave the same on Windows and Mac:

```
/apps/mobile      Expo (React Native, TypeScript, Expo Router). Also exports web for the share page.
/apps/api         Express API in TypeScript (moved from /backend with `git mv` to keep history).
/packages/core    Pure TypeScript: zod schemas, scheduler, replanner, diff, fuel/EV math, time-zone utils.
                  No network, no file or database I/O.
/supabase         SQL migrations + seed script.
/fixtures         Recorded API responses for tests (Mapbox, Overpass, etc.).
/docs             This brief, DECISIONS.md, PROGRESS.md, and the old docs.
```

**Stack defaults** (record any change in `docs/DECISIONS.md`):

| Concern | Default |
|---|---|
| Mobile | Expo (current stable SDK), TypeScript, Expo Router, EAS for builds |
| Map display | `@rnmapbox/maps` in an EAS development build; Mapbox GL JS on the web share page. The timeline is the primary UI and the map is secondary. Confirm Mapbox's terms for displaying Directions results. |
| Routing and geocoding | Mapbox Directions + Geocoding. Request full geometry (`polyline6`) and per-segment duration and distance annotations. |
| Places (fuel, food, rest areas, lodging, playgrounds, dog areas) | OpenStreetMap via the Overpass API, queried in corridor chunks and cached in Supabase. Parse `opening_hours` with a maintained library. Show "© OpenStreetMap contributors". Evaluate Mapbox's Search Box API (category / along-route search) as a fallback and record the decision. |
| **Do not use** | Google Places. It's expensive at our scale, and Google's terms restrict showing its place data on non-Google maps. |
| Time zones | An offline lat/lng → IANA time-zone lookup library, plus Luxon (or date-fns-tz) |
| Weather (stretch, after pilot) | US National Weather Service API (`api.weather.gov`), hourly forecast at each ETA point |
| EV charging stations (stretch, after pilot) | NREL Alternative Fuel Stations API |
| Database and auth | Supabase Postgres + Auth, with Row Level Security on every table |
| Validation | zod schemas in `/packages/core`, shared by the API and the app |
| Tests | Vitest for core and API; minimal component tests for the app |
| Lint and format | ESLint + Prettier. GitHub Actions CI runs lint, typecheck, and test on every push. |
| Dev scripts | Cross-platform only (for example `tsx watch`); no shell-specific environment syntax |
| Hosting (decide in M3) | Web share page and API must be reachable over HTTPS from phones on cellular. Vercel for the web export; the API on Vercel or a simple Node host (Render, Fly.io). |

---

## 4. Data contract (build in M0, freeze after M1)

Define these in `/packages/core/src/schemas.ts` with zod and export the TypeScript types. Adjust names if needed, but keep the concepts. After M1, changing this contract requires asking the humans.

```ts
LatLng   = { lat: number; lng: number }
PlaceRef = { name: string; lat: number; lng: number; address?: string }

Vehicle = {
  fuel: 'gas' | 'diesel' | 'ev';
  tankGallons?: number; highwayMpg?: number; fuelPercent?: number;  // gas/diesel
  rangeMiles?: number;  chargePercent?: number;                     // ev
  reservePercent: number;                                           // default 15
}

TravelParty = {
  adults: number; drivers: number;
  children: { age: number; nap?: { start: 'HH:mm'; end: 'HH:mm' } }[];
  dogs: number;
  bathroomIntervalMin?: number;     // default derived from the youngest child (see 5.3)
  maxContinuousDriveMin: number;    // default 120
  mealWindows: {                    // local times at the car's position
    breakfast: [string, string];    // default ['06:30', '09:00']
    lunch:     [string, string];    // default ['11:30', '13:30']
    dinner:    [string, string];    // default ['17:30', '19:30']
  };
  mealStyle: 'fast' | 'sitdown' | 'mixed';
  dietNotes?: string[];
  dailyDriveLimitMin: number;       // default 600
  earliestDepart: 'HH:mm';          // default '05:00'
  latestArrival: 'HH:mm';           // default '20:30', local time at the stop
  morningDepart: 'HH:mm';           // default '08:00', used after an overnight
}

TripRequest = {
  origin: PlaceRef; destination: PlaceRef;
  departAt?: string;                // ISO 8601 with offset; omit when asking for departure suggestions
  vehicle: Vehicle; party: TravelParty;
  hotelBreakfastCountsAsBreakfast: boolean;
}

PlaceOption = {
  id: string;
  source: 'osm' | 'mapbox' | 'nrel' | 'manual';
  sourceId: string;
  name: string; lat: number; lng: number;
  category: 'fuel' | 'ev_charger' | 'fast_food' | 'restaurant' | 'cafe'
          | 'rest_area' | 'services' | 'lodging' | 'playground' | 'dog_area';
  detourMin: number;
  openAtEta: boolean | null;        // null = unknown. Never guess.
  amenities: string[];
  links: { googleMaps: string; appleMaps: string; booking?: string };
}

StopNeed = 'fuel' | 'charge' | 'breakfast' | 'lunch' | 'dinner'
         | 'bathroom' | 'stretch' | 'overnight';

ItineraryItem = {
  id: string;
  kind: 'depart' | 'stop' | 'overnight' | 'arrive';
  needs: StopNeed[];                // one stop can combine several needs
  routeMile: number;
  etaUtc: string; localTime: string; tz: string;
  dwellMin: number;
  options: PlaceOption[];           // ranked; empty means "no verified place found here"
  selectedOptionId?: string;
  reason: string;                   // templated, e.g. "Lunch window + fuel at 22% — combined stop"
  locked: boolean;                  // e.g. a booked hotel
  status: 'planned' | 'done' | 'skipped';
}

Plan = {
  tripId: string; version: number; createdAt: string;
  request: TripRequest;
  route: { distanceMi: number; durationMin: number; polyline6: string };
  days: { dayIndex: number; date: string; items: ItineraryItem[] }[];
  totals: { driveMin: number; stopMin: number; arriveAtLocal: string; overnights: number };
  assumptions: string[];            // every default applied, in plain English
  warnings: string[];               // e.g. "No verified fuel between mile 310 and mile 420"
}

PlanDiff = {
  changes: {
    itemId: string;
    what: 'moved' | 'added' | 'removed' | 'option_changed';
    before?: string; after?: string;
    summary: string;                // "Lunch moved from Temple (12:10) to Waco (12:55)"
  }[];
  hotelConflict?: { lockedItemId: string; reason: string; alternatives: PlaceOption[] };
}

TripEvent = {
  tripId: string;
  type: 'plan_viewed' | 'replan_requested' | 'stop_navigated' | 'stop_done'
      | 'stop_skipped' | 'hotel_link_clicked' | 'feedback';
  at: string; itemId?: string; location?: LatLng;
  payload?: Record<string, unknown>;
}
```

---

## 5. The scheduler (the heart of the product)

Build it as a pure, deterministic function in `/packages/core`:

```ts
buildPlan(request: TripRequest, route: RouteData, places: PlacesProvider): Promise<Plan>
```

`PlacesProvider` is injected so core stays free of I/O. The API passes a real provider; tests pass a fixture provider. The same inputs must always produce identical output.

**5.1 Route timeline.** From the Mapbox route geometry and per-segment durations, build a cumulative (mile, seconds) timeline that answers "where is the car at time T?" and "when does it reach mile M?".

**5.2 Simulation.** Walk forward from `departAt`, tracking remaining fuel, time since the last bathroom stop, continuous drive time, today's drive time, and local time (the time zone at the car's current position). Raise a need when:

- **fuel:** remaining range reaches the reserve plus a lookahead margin. Reuse the gas/EV math, but inside the time-based simulation.
- **bathroom:** the bathroom interval is reached.
- **stretch:** `maxContinuousDriveMin` is reached.
- **meal:** local time enters a meal window. Target 15–30 minutes after the window opens, never before it opens, and before it closes. If no option exists, add a warning.
- **overnight:** today's drive time would exceed `dailyDriveLimitMin`, or arriving at the next feasible stop would be later than `latestArrival`.

**5.3 Default bathroom interval.** Youngest child under 4 → 90 minutes; under 10 → 120 minutes; otherwise 180 minutes. Always overridable, and always listed in `assumptions`.

**5.4 Stop stacking (important for families).** If several needs come due within a 30-minute window, combine them into one stop at the earliest point that satisfies the hardest constraint. Fuel reserve is a hard constraint; meals, bathroom, and stretch breaks are soft. Dwell time is the largest individual dwell plus 5 minutes. Default dwells: fuel 10, bathroom 10, stretch 10, fast food 30, sit-down 60, mixed 40, EV charge from the EV math.

**5.5 Naps.** Avoid putting soft stops inside a child's nap window. Shift them to just before or after when that's within 30 minutes. Hard stops (fuel) still win.

**5.6 Overnight.** The overnight zone is the stretch of route reached between (target stop time − 45 minutes) and the target stop time, where target = the earlier of `latestArrival` and the moment `dailyDriveLimitMin` is hit. Offer lodging within a 10-minute detour, ranked by detour and amenities (prefer pet-friendly when `dogs > 0`). The next day starts at `morningDepart`; skip the breakfast stop when `hotelBreakfastCountsAsBreakfast` is true.

**5.7 Places.** For each stop, ask the provider for options near that route point. Detour budget: 5 minutes for fuel and bathroom, 10 minutes for meals and lodging. Filter by category and `openAtEta`; keep options with unknown hours but label them. If nothing is found, slide the stop ±15 minutes along the route and retry once. Otherwise keep the stop with empty `options` and add a warning. **Never fabricate.**

**5.8 Reasons.** Every stop gets a templated, plain-English reason. No LLM anywhere in M0–M4.

**5.9 Departure suggestions.**

```ts
suggestDepartures(request, route, places, { from, to, stepMin = 15 }): Promise<DepartureOption[]>  // top 3
```

Score each candidate departure (lower is better) on: total trip duration, number of stops, a penalty for arriving after `latestArrival`, a penalty for driving after 21:00, and a bonus for drive time overlapping kids' naps. Document the weights in code and in `docs/DECISIONS.md`. Each option includes a one-line explanation, such as "Leave at 12:30 — the 3-year-old naps through the first 90 minutes."

**5.10 Re-planning.**

```ts
replan(previous: Plan, update: { location: LatLng; at: string; fuelPercent?: number }, route: RouteData, places: PlacesProvider)
  : Promise<{ plan: Plan; diff: PlanDiff }>
```

- Snap the location to the route. If it's more than 2 km off the route, the API layer requests a new route from the current location, and core receives that new route.
- Keep items marked `done`. Recompute everything after the current position, keeping `locked` items fixed.
- If a locked overnight would now be reached more than 60 minutes after `latestArrival`, or more than 90 minutes before the target stop time, return a `hotelConflict` with alternatives.
- Produce a human-readable diff, such as "Lunch moved from Temple (12:10) to Waco (12:55)."

---

## 6. API (`apps/api`)

All routes live under `/api/v1`. Validate every input with the core schemas. Errors return `{ error, message }` — **never fake data.**

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/plans` | Create a trip and plan v1 from a `TripRequest` |
| `POST` | `/plans/departure-options` | Return the top 3 departure times with scores and explanations |
| `GET` | `/plans/:tripId` | Latest plan (owner or share token) |
| `POST` | `/plans/:tripId/replan` | New plan version + `PlanDiff` |
| `POST` | `/plans/:tripId/items/:itemId` | Mark done/skipped, select an option, lock/unlock |
| `POST` | `/plans/:tripId/events` | Log one or more `TripEvent`s |
| `POST` | `/plans/:tripId/share` | Create or revoke a share token |
| `GET` | `/health` | Health check |

**Auth.** Owners authenticate with a Supabase JWT. A share token (random, at least 128 bits, stored hashed) grants access to one trip only: read, replan, item status, and events. It can't delete anything or edit the original request. Rate-limit replans per token.

**Hotel links.** Build a Booking.com search deep link for the overnight zone (location, check-in/check-out dates, adults, children) and append `BOOKING_AFFILIATE_ID` when it's set. Verify the parameter names against the affiliate program's docs. Put this behind a `LodgingLinkProvider` interface so an Expedia link or a real booking API can be added later.

**Navigation links.** "Navigate" opens the stop in Google Maps or Apple Maps using their documented URL schemes. Don't build turn-by-turn navigation.

---

## 7. Database (Supabase)

| Table | Contents |
|---|---|
| `profiles` | One row per user |
| `parties` | Saved family profiles (`TravelParty`) |
| `vehicles` | Saved vehicles |
| `trips` | Trip metadata, owner, status |
| `plan_versions` | `jsonb` plan, version number, reason, `created_at` |
| `trip_events` | `TripEvent` rows |
| `share_tokens` | Hashed tokens, trip id, created/revoked timestamps |
| `place_cache` | Tile key, category, payload, `fetched_at` |

- **Row Level Security** on every table: users see only their own rows. Share-token access goes through the API using the service key.
- **No continuous location history.** Store location only when it's attached to a replan request or an event.
- **Seed script** with one demo family and one demo trip.
- Add a simple SQL view for the founders: plans created, share links opened, replans, hotel-link clicks, and stops done vs. skipped.

---

## 8. App (`apps/mobile`) — screens

Timeline first, map second. Use large tap targets in active-trip mode.

1. **Safety screen (first launch).** "A passenger should use xNovit while the car is moving." The user must acknowledge it.
2. **Family setup.** Adults, drivers, kids (age + optional nap window), dogs, meal style, daily driving limit, latest arrival. Sensible defaults pre-filled and labeled as defaults.
3. **Vehicle.** Fuel type, tank size, highway MPG, current fuel %. Manual entry with defaults is fine; a year/make/model lookup is out of scope.
4. **Plan a trip.** Origin and destination (Mapbox geocoding autocomplete), date, and either "Leave at…" or "Suggest the best time."
5. **Plan view.** Day tabs → a timeline of stops showing local time, need icons, the reason line, the top option, and "other options." Each stop has "Navigate" (opens Google Maps or Apple Maps). The overnight stop has "See hotels" (affiliate link). Assumptions and warnings sit collapsed at the bottom. Include a route map preview.
6. **Active trip.**
   - Next-stop card with "Done" and "Skip."
   - "I'm running late — update my plan": uses current location → replan → shows the diff to accept or dismiss.
   - "Need a break now": the nearest **real** rest area or services ahead, from OSM data.
   - "Emergency": dials 911 and opens the system share sheet with current coordinates. No lookups, no generated content.
7. **Share.** Create a share link. The share page at `/p/[token]` (Expo Router web) shows the same plan view, plus "Update my plan" using browser geolocation.
8. **Trips list.** Upcoming and past trips.

**Accessibility:** dynamic type, screen-reader labels, sufficient color contrast, and dark mode. The old spec's black-and-gold look is fine as a theme but not required.

---

## 9. Milestones (dates are targets)

### M0 — Foundation and safety cleanup (by Wednesday, October 14)
- Restructure into the monorepo with `git mv backend apps/api`. Convert the API to TypeScript and make all scripts cross-platform.
- Delete `aiService.js`, the emergency, stops, and rewards routes, `iosTripCodec.js`, and the OpenAI dependency and env var.
- Create `packages/core` with the zod schemas from Section 4. Port the gas/EV math with unit tests.
- Add CI (lint, typecheck, test), an `.env.example` per app, `docs/DECISIONS.md`, and `docs/PROGRESS.md`.
- Add the "superseded by this brief" note to the old docs.
- **Done when:** `npm install && npm run dev` works on Windows and Mac, CI is green, and no route returns invented data.

### M1 — Scheduler engine (by Friday, October 23)
- Fetch Mapbox routes with full geometry and annotations. Record fixtures for the golden trips (Section 10).
- Implement 5.1–5.6, 5.8, and 5.9 in core, using a fixture places provider.
- `POST /plans` and `POST /plans/departure-options` return real schedules. Empty place options are acceptable at this stage.
- **Done when:** the golden-trip structural tests pass and the same input always produces identical output.

### M2 — Real places (by Friday, October 30)
- Build an Overpass places provider with corridor chunking, caching in `place_cache`, `opening_hours` parsing, and detour estimates. Straight-line distance × a road factor is fine to start; refine later.
- Categories: fuel, fast food, restaurant, cafe, rest area/services, lodging, playground, dog area.
- Implement 5.7, including warnings when no verified place exists.
- **Done when:** the golden trips return real options with source ids for at least 90% of stops, and no option lacks a source.

### M3 — App and share page (by Monday, November 9)
- Build screens 1–5, 7, and 8 against the live API. Add Supabase auth (email magic link) and share tokens.
- Deploy the API and the web share page to public HTTPS URLs (see Section 3, Hosting).
- The web share page must work in iPhone Safari and Android Chrome.
- **Done when:** a founder can create a plan for a new family in under 3 minutes and text them a working link.

### M4 — Re-planning, hotels, events (feature freeze Wednesday, November 18)
- Implement 5.10 re-planning with a diff UI, in both the app and the share page. Build the active-trip screen (screen 6).
- Add Booking.com deep links with the affiliate id, and `hotelConflict` alternatives.
- Log every `TripEvent` type. Create the founders' SQL view.
- **Done when:** every item on the pilot readiness checklist (Section 11) passes.

### Pilot week (November 19–29)
Bug fixes only. No new features.

### After Thanksgiving
Only after the humans review the pilot data. Candidates: a drive-vs-fly calculator page, corridor weather (NWS), EV charging (NREL), push notifications, background location, a per-trip pass purchase, and an Expedia link provider. **Don't start any of these without a go-ahead.**

---

## 10. Golden test trips

All fixture-based. Assert **structure**, not specific towns.

1. **College Station, TX → Denver, CO.** Depart Wednesday, November 25, 2026, 06:00 Central. 2 adults (both drive), kids aged 3 (nap 13:00–14:30) and 7, 1 dog. Minivan: 19.5 gal tank, 28 mpg highway, 60% fuel. Daily limit 600 min, latest arrival 20:30. Expect one overnight, pet-friendly lodging preferred, and no soft stop inside the nap window unless fuel-critical.
2. **Houston, TX → Orlando, FL.** Depart 05:30 Central. The route crosses into Eastern time, so meal windows after the crossing must use local time.
3. **College Station, TX → Dallas, TX.** Depart 10:00. No overnight; lunch only if the drive overlaps the lunch window.
4. **Trip 1 in departure-suggestion mode,** between 04:00 and 09:00. Returns 3 ranked options with explanations.
5. **Re-plan.** Take the plan from trip 1 with the overnight locked. Report a location about 90 minutes behind schedule in mid-afternoon on day 1. Expect a diff and a `hotelConflict` with alternatives.

**Structural assertions for every trip:**
- Fuel never drops below the reserve.
- No meal falls outside its local window, unless a warning explains why.
- No two stops are closer than 20 minutes apart unless one is fuel-critical.
- An overnight appears only when the daily limit or latest arrival requires it.
- Every `PlaceOption` has `source`, `sourceId`, and coordinates.
- Every applied default appears in `assumptions`.
- Output is deterministic.

---

## 11. Pilot readiness checklist (all must be true by November 18)

- [ ] A founder can create a plan for a new family in under 3 minutes.
- [ ] The share link opens and is usable in iPhone Safari and Android Chrome on cellular data.
- [ ] "Update my plan" works from the share page and shows what changed.
- [ ] Hotel links include the affiliate id (when configured), and clicks are logged.
- [ ] All `TripEvent` types are recorded, and the founders' SQL view works.
- [ ] Failures (no network, Mapbox or Overpass errors) show a clear message. Nothing is faked.
- [ ] OSM and Mapbox attribution are visible wherever their data or maps appear.
- [ ] The safety screen shows on first launch. The emergency button dials 911 and shares coordinates.
- [ ] The share page has a short privacy note. Location is stored only with replans and events.

---

## 12. Out of scope (don't build unless the humans ask)

Turn-by-turn navigation · rewards or points · "vibe modes" · 3D views or weather visuals · trucker or RV routing · convoy/group trips · social feeds or road reports · order-ahead or restaurant reservations · in-app payments · ads or sponsored placements · LLM chat or LLM-generated content · Google Places · scraping any website.

---

## 13. What the humans need to set up

List these back to the founders at the end of M0, marking which milestone needs each one.

| Item | Needed by | Notes |
|---|---|---|
| Mapbox account + access token | M1 | Restrict the token to the APIs we use. |
| Supabase project (URL, anon key, service key) | M3 (M0 for migrations, if possible) | The service key goes only in the API's environment, never in the app. |
| Hosting for the API and web share page | M3 | For example Vercel for the web export, plus Vercel/Render/Fly.io for the API. |
| Booking.com affiliate application → affiliate id | M4 | Approval can take time. Links work without it; they just don't earn commission. |
| Expo account + EAS | M3 | Needed for the `@rnmapbox/maps` development build. |
| Apple Developer account | Only if TestFlight is wanted | Not needed for the web-link pilot. |
| Overpass | M2 | The public instance is fine for the pilot with caching. Respect its usage policy. |
| NWS contact email (User-Agent) and NREL API key | After the pilot | Only for the stretch features. |
