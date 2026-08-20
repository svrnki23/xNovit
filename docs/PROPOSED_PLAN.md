# xNovit — Updated Plan (Blends Old Docs + AI Planning Chat + Our Discussion)

## Why this document exists

This project has three sources of ideas that don't fully agree with each other:

1. **The original docs in this repo** (`PRODUCT_SPECIFICATION.md`, `TECH_STACK.md`, `WORKFLOWS.md`) — written assuming truckers are a main user, and assuming a big team.
2. **The Xcode/iOS folder in this repo** — currently empty, so no real progress exists there yet.
3. **The AI planning chat (the PDF)** — which changed direction partway through to focus only on everyday drivers (students, families, tourists), and assumed a lean 2-person team.

This document is the **one combined plan** going forward. It does not delete or edit the old docs — think of it as the new source of truth that replaces them once the team agrees. Every change below explains **what it replaces and why**, in plain language.

---

## 1. The Big Picture — What Changed

| Topic | Old plan (repo docs) | New plan (this document) | Why we changed it |
|---|---|---|---|
| Who the app is for | Truckers **and** families/road-trippers | Only everyday drivers: students, families, tourists | Truckers need extra legal and technical work (bridge height limits, weigh stations, work-hour rules) that a 2-person team doesn't need to take on. The AI planning chat reached the same conclusion. |
| Team size | Docs assumed a big team (7-8 people) with specialized roles | 2 developers, using AI coding tools to move faster | That's the real team size. No plan should assume people that aren't there. |
| How trip data is generated | Docs assumed real maps, real routing, real restaurant data | Same goal, but we're honest that **none of this is built yet** — see Section 4 | The current code fakes almost everything instead of calculating it for real. This needs to be fixed before the app can be trusted. |
| Frontend platform | Docs assumed a native iOS Swift app first | One shared app for iOS **and** Android, built with React Native | Nothing has been built on iOS yet, so there's no work to lose. A shared codebase means no duplicate work, and it can be built and tested from Windows without needing a Mac. |
| Database/backend hosting | Docs recommend running your own Postgres, PostGIS, and Redis servers | Use a hosted service (Supabase) instead | Running your own servers is extra work a 2-person team doesn't need. A hosted service gives the same features (maps-friendly database, user accounts) with far less setup. |

---

## 2. Full Feature List — What's Kept, Changed, Added, or Removed

Each feature below is tagged:
- **[KEPT]** — stays the same as the old docs, both sources agreed on it
- **[CHANGED]** — the idea stays, but how it works is different now
- **[NEW]** — wasn't in the old docs, coming from the AI planning chat
- **[REMOVED]** — cut from the plan, with the reason why

### Trip setup
- **[KEPT]** Enter start point and destination, with option to add stops along the way.
- **[KEPT]** Round trip vs one-way trip.
- **[KEPT]** Choose miles/gallons or km/liters.
- **[KEPT]** Choose a departure time, or "leave now."
- **[REMOVED]** Trucker-specific setup (commercial vehicle details, work-hour tracking). *Why: no longer the target audience.*

### Vehicle & fuel
- **[KEPT]** Enter vehicle's tank size, current fuel level, and MPG (miles per gallon) so the app knows how far it can go before needing gas.
- **[KEPT]** Electric vehicle (EV) mode — same idea, but for battery range and charging stops instead of gas.
- **[NEW]** Let users filter for the **cheapest** nearby gas, not just the closest one.
- **[CHANGED]** This calculation must be done with real math (tank size, current fuel, MPG → how many miles until empty), not invented by AI. See Section 4.

### Rest stops
- **[KEPT]** Only suggest rest areas that are ahead of the driver, not behind or on the opposite side of the road.
- **[KEPT]** "I'm tired" button — one tap finds the nearest safe place to stop within about 15 minutes.
- **[NEW]** Filter rest stops for pet-friendly areas (dog walking spots) — came from the AI planning chat, fits families with pets.

### Restaurants
- **[KEPT]** Recommend restaurants based on what time the driver will actually be there (e.g., breakfast spot around 7am if that's when they'll be driving through), not just "nearby food."
- **[KEPT]** Filter by cuisine, fast food vs. sit-down, vegetarian/non-vegetarian, and price.
- **[NEW]** Rename this to feel more like a "vibe" — group restaurant suggestions by traveler type (see Fun Activities below), matching what students, families, or tourists would actually want.

### Hotels
- **[KEPT]** Only suggest hotels/motels during overnight hours (for example, 10pm–6am), not randomly during the day.
- **[KEPT]** Filter by price, rating, and pet-friendly.

### Route choices
- **[KEPT]** Choice between fastest route and scenic route.
- **[KEPT]** Automatically avoid suggesting a scenic route late at night (11pm–4am), since it's dark and less safe. *(Both the old docs and the AI planning chat agree on this — it just isn't coded yet. See Section 4.)*
- **[REMOVED]** Any route logic specific to trucks (weight limits, low bridges, no-truck roads). *Why: no longer the target audience.*

### Weather
- **[KEPT]** Show weather conditions (rain, wind, snow) along the route ahead, updated every hour on long trips.
- **[REMOVED / DELAYED]** "3D" animated weather visuals. *Why: both the old docs and the AI planning chat agree this is very hard to build well and isn't needed for a first version. Plain text/icon alerts (like "rain in 45 minutes near mile 120") do the same job for much less work.*

### Fun activities ("Road Trip Curator")
- **[CHANGED]** Old docs split this by trucker vs. passenger. **[NEW]** New plan splits it by traveler "mode" instead:
  - **Student mode** — cheap/free attractions, hiking, photo spots.
  - **Family mode** — kid-friendly stops like parks, museums, playgrounds.
  - **Tourist mode** — landmarks, hidden gems, historic sites.
- *Why: this fits the actual target users much better than a trucker/passenger split, and the AI planning chat's idea here was genuinely better.*

### Safety & emergency
- **[KEPT]** "I've broken down" button — shares location, shows nearest tow truck/hospital/police.
- **[NEW]** A clear, simple safety warning shown when the app opens (e.g., "Don't use this while driving — let a passenger help"). *Why: cheap and important to have from day one, called out in the AI planning chat as a legal basics step.*

### Rewards
- **[KEPT]** Earn points for eco-friendly choices (fuel-efficient routes, partner stops); redeem for discounts.
- **[CHANGED]** Points should be tied to a real user account, not one shared number for everyone (this is how it works right now, and it's a bug — see Section 4).
- **[NEW]** Clearer earning rule from the AI planning chat: award points automatically when a user actually completes a route marked "eco-friendly," instead of only through a manual "earn points" button.

### Budget, pets, social features, group trips, fleet/B2B view
- **[KEPT, BUT LOW PRIORITY]** All of these stay on the long-term feature list, but are **not** part of the first working version. *Why: both the old docs and the AI planning chat agree these come after the core app works.*

### Partner integrations (Flexicars car rental, Viktographix dashcams, Taruna restaurant chain)
- **[KEPT, BUT LOW PRIORITY]** Good ideas for later, once the app has real users. Not part of the first version.

---

## 3. Updated Target Users

**Before:** Truckers, road-tripping families, solo long-haul drivers, EV drivers.

**Now:** Everyday drivers planning a trip — students on a budget, families with kids, and tourists exploring. No commercial/trucker use case.

---

## 4. Being Honest About What's Actually Built Right Now

This is important and easy to miss just by reading the code: **the app currently does not calculate anything for real.**

What exists today (in the `backend/` folder):
- A working Node.js server with routes for calculating a trip, finding nearby rest stops, handling emergencies, and tracking reward points.
- When a trip is requested, the server either **asks an AI model (ChatGPT) to make up realistic-sounding trip details**, or — if no AI key is set — **returns the exact same fake trip every time** (always "280 miles, 270 minutes," no matter where you actually type in).
- There is no real map, no real driving directions, no real restaurant lookup, and no real gas station data anywhere in the code yet. It only *looks* like a working trip planner because the fake data is realistic-sounding.

This matches Phase 1 of the AI planning chat's suggested build order — that phase was supposed to build the *real* math and *real* map connection first. That hasn't happened yet. It needs to, before this can be a real product.

**A few small bugs found while reviewing the code (worth fixing along the way, not urgent):**
- Sending a negative number to the "redeem points" feature currently *adds* points instead of subtracting them.
- Sending text instead of a number to "earn points" permanently breaks the points counter until the server restarts.
- If a trip request is missing a start time, the server crashes instead of just assuming "now."
- The code that checks "is this a valid ID" for the iOS-style data only checks for a dash character, which isn't a real enough check and could cause crashes on some data.
- The `npm run dev` command (used to start the backend) is written in a way that only works on Mac/Linux, not Windows, so it needs a small fix to run on a Windows machine.

None of these are big rewrites — just things to patch once these files are being actively worked on again.

---

## 5. Tech Stack Going Forward

| Part of the app | What to use | Why |
|---|---|---|
| Mobile app (iOS + Android) | **React Native** with **TypeScript**, using **Expo** | One codebase for both phones. TypeScript matches the backend's language. Expo allows testing on a real iPhone from a Windows PC (no Mac needed) and can even build/submit the iOS app in the cloud. |
| Backend | Keep the existing **Node.js/Express** server, but replace the "AI makes up the trip" logic with real calculations and real map data | The server structure already in this repo is fine to build on — it just needs real logic instead of fake/AI-invented data. |
| Real map & directions | **Mapbox** (recommended) or Google Maps, for actual routes, distances, and travel times | Needed to replace the current hardcoded "280 miles" placeholder with real numbers. |
| Restaurant/gas/hotel data | **Google Places API** or similar, queried along the real route | Needed to replace AI-invented restaurant names with real, currently-open places. |
| Database & accounts | **Supabase** (a hosted service) instead of running your own database servers | Gives a real database, user login system, and location-search features (PostGIS) without needing to set up and maintain servers. Much less work for a small team. |
| Code editor | **VS Code**, works identically on Windows and Mac | Neither person needs Xcode for day-to-day work. |

---

## 6. Working Across Windows and Mac Without Losing Progress

- **Keep platform folders separate:** `backend/`, `app/` (the React Native project), `docs/`. This avoids two people editing the same files at the same time.
- **Add a `.gitignore`** so build files and IDE settings from each computer never get shared or cause fake conflicts.
- **Add a `.gitattributes` file** to fix line-ending differences between Windows and Mac — without this, editing the same file on both computers creates messy, confusing differences in Git even when no real change was made.
- **Commit and push often** in small pieces, so no one is sitting on hours of un-shared work.
- **Agree on the data shape first.** Before writing code, decide exactly what a "trip" object looks like (what fields it has). That way, the app screens can be built against sample/fake data matching that shape while the real backend logic is being built at the same time — no one has to wait on the other.

---

## 7. Suggested Build Order (First Version Only)

This keeps the same 4-phase shape from the AI planning chat, adjusted for the fact that some backend scaffolding already exists.

**Phase 1 — Real Foundations**
- Add user accounts/login (Supabase).
- Connect to a real map service and get real routes (replace the fake "280 miles" data).
- Build the real gas/EV stop math (tank size + MPG + current fuel → where to stop).

**Phase 2 — Real Restaurant Timing**
- Build the "where will the car be at 7am" prediction logic.
- Connect to a real restaurant data source (Google Places) filtered by meal-time, cuisine, and price choices.

**Phase 3 — Fun Extras**
- Add Student/Family/Tourist "vibe modes" for fun activities.
- Fix the rewards system so points are tied to a real account and awarded automatically for eco-friendly routes.

**Phase 4 — Safety & Polish**
- Add the night-time scenic-route safety rule (turn it off between 11pm–4am).
- Add the safety disclaimer screen.
- Fix the small bugs listed in Section 4.
- Test on real phones and prepare for app store submission (TestFlight for iOS, Play Console for Android).

---

## 8. Open Questions to Settle as a Team

- Confirm everyone is fully on board with dropping trucker support, since it affects assumptions already baked into the current docs.
- Decide how to divide the work across the phases above.
- Decide when to start paying for map/restaurant API usage — these cost money once past free trial limits, so it's worth agreeing on a budget before turning that on.
