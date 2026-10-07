> **Superseded on October 7, 2026.** The source of truth is now the build brief, [XNOVIT_BUILD_BRIEF.md](XNOVIT_BUILD_BRIEF.md). This document is kept for history only.

# xNovit — Product Specification & Technical Blueprint

**Version:** 1.0  
**Last Updated:** March 2025  
**Product:** xNovit — Fully customizable long-trip driving experience (truckers, road trippers, families)

---

## 1. Product Overview

### 1.1 Vision

xNovit plans your long drive so you get the right rest stops, gas, meals, and sleep at the right time—with weather along your route and rewards for smarter choices. One app that unifies rest areas, gas stations, meal-time restaurants, hotels, route preferences, fun activities, and corridor weather for truckers and road trippers across North America.

### 1.2 Target Users

| Segment | Primary Needs |
|--------|----------------|
| **Truckers** | Rest areas, fuel (diesel/truck stops), HOS-aware rest, weigh stations, parking availability, meal stops, no “fun activities” clutter |
| **Road trippers (families)** | Rest areas, gas, meal-time restaurants, hotels, scenic options, fun activities, pet-friendly stops |
| **Solo long-haul drivers** | Safety-focused rest, gas, meals, overnight hotels, fatigue prompts |
| **EV drivers** | Charging stops (instead of gas), rest, meals, weather, range-aware routing |

### 1.3 Core Value Propositions

- **Meal-time–aware routing:** Get routed to breakfast/lunch/dinner stops (e.g., IHOP/Starbucks at 7am) based on where you’ll be at that time.
- **One unified trip plan:** Rest areas, gas, food, sleep, and weather in a single, time-aware plan.
- **Fully customizable:** Trip type, measurements, vehicle, cuisine, diet, price range, scenic vs fastest, trucker vs passenger.
- **Safety and wellness:** Fatigue prompts, safe-stop quality, emergency flow, optional health reminders.
- **Rewards:** Points for eco-friendly choices and partner stops; redeem for fuel, discounts, or perks.

---

## 2. Complete Feature List

### 2.1 Trip Planning (Core)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F01 | **Origin & destination** | Enter start and end; support swap origin/destination. | P0 |
| F02 | **Trip type** | Round trip vs one-way. | P0 |
| F03 | **Add stops** | Optional waypoints between origin and destination (multiple). | P0 |
| F04 | **Measurements** | US (miles, gallons, °F) vs Metric (km, L, °C). | P0 |
| F05 | **Start time** | User sets departure time (or “leave now”); drives all time-based suggestions. | P0 |
| F06 | **Best time to leave** | Suggestion based on traffic, weather, and desired arrival (e.g., “Leave by 6am to avoid rain”). | P1 |
| F07 | **Buffer time** | User sets buffer (e.g., 20%); plan legs so ETA is not cutting it close. | P1 |
| F08 | **Time-zone clarity** | For long east–west trips, show time-zone crossings and “your time” for stops. | P1 |
| F09 | **Construction & closures** | Show major roadworks/closures on route; suggest alternatives or expected delay. | P1 |
| F10 | **Trip templates** | Presets: “Family road trip,” “Solo overnight,” “Trucker run,” “EV road trip” (pre-set preferences). | P1 |
| F11 | **Learn from past trips** | Remember meal times, preferred chains, rest frequency; “Like last time?” suggestions. | P2 |
| F12 | **Trip export** | Export plan as PDF or shareable link (stops, times, addresses) for reimbursement or sharing. | P2 |

### 2.2 Vehicle & Fuel

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F13 | **Vehicle info** | Year, Make, Model, Trim (cascading dropdowns). | P0 |
| F14 | **Fuel type** | Regular, Premium, Diesel, etc. | P0 |
| F15 | **Fuel efficiency** | City MPG, Highway MPG (or L/100km). | P0 |
| F16 | **Tank capacity** | Full tank capacity (gallons or L). | P0 |
| F17 | **Gas remaining** | User inputs current fuel remaining (or %). | P0 |
| F18 | **Gas station stops** | Add stops along route based on range, MPG, and tank; show cheapest/most convenient. | P0 |
| F19 | **EV mode** | Battery range, current %, efficiency → charging stops along route (same flow as gas). | P1 |
| F20 | **Full tank mileage** | Implicit from tank × MPG; used for “next stop” calculations. | P0 |

### 2.3 Rest Areas & Stops

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F21 | **Rest areas in direction only** | Recommend only rest areas ahead in direction of destination (no wrong-side). | P0 |
| F22 | **Rest area list** | All upcoming rest areas with distance, ETA, amenities (restroom, vending, picnic). | P0 |
| F23 | **Safe-stop quality** | Where data exists: well-lit, security, 24/7, restroom quality; filter/sort “safest first.” | P1 |
| F24 | **Real-time rest area status** | Parking availability, crowded/closed (community or official data). | P1 |
| F25 | **“I’m tired” / need a break** | One tap → nearest safe rest in next 10–15 min (rest area, truck stop, safe parking). | P0 |
| F26 | **Fatigue / drowsiness prompts** | After X hours or time-of-day + long drive, nudge: “Consider a rest in 15 min.” | P1 |

### 2.4 Restaurants & Meals

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F27 | **Meal-time restaurant routing** | Re-route or suggest restaurants by meal window (e.g., breakfast 6–9am, lunch 11:30–1:30, dinner 6–8pm) based on ETA. | P0 |
| F28 | **Meal preferences** | Fast food vs sit-down; cuisine; veg/non-veg; price range. | P0 |
| F29 | **Chain / type by time** | e.g., IHOP/Starbucks for breakfast; suggest only meal-appropriate options at that hour. | P0 |
| F30 | **Restaurant filters** | Cuisine, price, rating, distance off route (max detour). | P0 |
| F31 | **Order ahead** | “Order at this Starbucks for pickup in 25 min” when stop is in plan (deep link or partner API). | P1 |
| F32 | **Reservation hooks** | For sit-down: “Reserve at this Cracker Barrel at 12:30” (OpenTable or partner). | P1 |
| F33 | **Pet-friendly dining** | Filter for pet-friendly restaurants at stop. | P1 |

### 2.5 Hotels & Overnight

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F34 | **Overnight hotel prompts** | Suggest nearby motels/hotels only during “overnight” window (e.g., 10pm–6am or user-defined). | P0 |
| F35 | **Hotel filters** | Price, rating, chain, amenities (breakfast, pet-friendly). | P0 |
| F36 | **Book / deep link** | Link to booking site or partner for selected hotel. | P0 |
| F37 | **“Rest tonight?”** | One-tap “Find place to stay tonight” → best options along route in next 1–2 hours. | P1 |

### 2.6 Route & Navigation

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F38 | **Route preference** | Scenic vs fastest / most fuel-efficient (with time estimate). | P0 |
| F39 | **Scenic vs time-of-day** | Do not suggest scenic when unreasonable (e.g., 11pm–4am = dark). | P0 |
| F40 | **Scenic score** | Per segment: “Next 50 mi: 8/10 scenic (mountains, lake views).” | P1 |
| F41 | **Quiet vs busy stretch** | Show which segments are low-traffic vs busy (for planning calls/rest). | P1 |
| F42 | **Turn-by-turn** | In-app or handoff to Apple Maps / Google Maps / Waze. | P0 |
| F43 | **Offline / download trip** | Download route, stops, basic weather for trip; works in low/no connectivity. | P0 |

### 2.7 Weather

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F44 | **Corridor weather** | Weather along the route (next 1–2 hours of driving), not just destination. | P0 |
| F45 | **Update frequency** | Long trips: refresh every 1 hr; short trips: every 30 min; configurable. | P0 |
| F46 | **Weather elements** | Wind, rain, lightning, snow; severity and timing. | P0 |
| F47 | **Predictive alerts** | e.g., “Heavy rain in ~45 min near Mile 120”; optional re-route to stay dry. | P0 |
| F48 | **Instant hazard alerts** | Push for sudden storms, accidents, road closures (in addition to scheduled updates). | P0 |
| F49 | **3D weather (optional)** | Optional 3D visualization of weather along route (later or premium). | P2 |

### 2.8 User Type & Activities

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F50 | **Trucker vs passenger** | User selects; truckers get rest/fuel/HOS-focused UX; passengers get fun activities. | P0 |
| F51 | **Fun activities** | For passengers: POIs along route (parks, landmarks, attractions); filter by detour/time. | P0 |
| F52 | **No fun activities for truckers** | When “trucker” selected, hide or de-emphasize fun activities. | P0 |
| F53 | **HOS (truckers)** | Hours-of-service awareness: suggest rest before 10-hour limit; 30-min break reminders (optional). | P1 |

### 2.9 Safety & Wellness

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F54 | **Emergency / breakdown** | One-tap “I’ve broken down” → share location, nearest tow/mechanic/hospital, notify contact. | P0 |
| F55 | **Medication / health reminders** | Optional: “Remind me to take [medication] in 2 hours” or “Stretch every 2 hours.” | P1 |
| F56 | **Safe stop quality** | (See F23) Well-lit, security, 24/7 for rest areas and truck stops. | P1 |

### 2.10 Budget & Cost

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F57 | **Budget mode** | User sets trip budget; favor cheaper gas, affordable food, budget motels. | P1 |
| F58 | **Estimated trip cost** | Show estimated total (gas + food + lodging) and “Under budget by $X” when applicable. | P1 |

### 2.11 Pets

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F59 | **Pet-friendly mode** | Filter rest areas and stops that allow pets; dog parks, relief areas. | P1 |
| F60 | **Pet-friendly hotels** | Filter overnight options by pet-friendly. | P1 |

### 2.12 Social & Community

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F61 | **Real-time road reports** | User-submitted: “Rest area full,” “Gas closed,” “Accident at Mile 42,” “Construction.” | P1 |
| F62 | **Trip feed / road pulse** | Lightweight feed of recent reports along your route (next 1–2 hours). | P1 |
| F63 | **Shared trip** | Share live trip link; family sees ETA and current stop; optional “Stopped for the night” notify. | P1 |

### 2.13 Rewards & Engagement

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F64 | **Eco-friendly stops** | Suggest stops that are eco-friendly (e.g., fuel-efficient route, EV charging). | P0 |
| F65 | **Rewards points** | Earn points for eco choices, partner gas/food stops; clear rules (who pays, what counts). | P0 |
| F66 | **Redemption** | Redeem points for fuel vouchers, discounts, car rental, carbon offset (partner-dependent). | P0 |
| F67 | **Streaks / milestones** | “5 trips planned,” “10 eco stops,” “First overnight”; light gamification. | P1 |
| F68 | **Challenges** | Optional: “Plan a trip under $150,” “Zero fast food this trip”; badges. | P2 |
| F69 | **Referral rewards** | Invite co-driver/friend; both get points. | P1 |

### 2.14 Experience & UX

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F70 | **Audio trip brief** | Before leave or each leg: short audio summary (duration, rest areas, meal stop, weather). | P1 |
| F71 | **Calendar-aware** | Optional: “Trip to Denver” from calendar → suggest leave time, pre-fill destination. | P1 |
| F72 | **Wallet / payment** | Pay at partner fuel/food in-app; link to rewards and receipts (later phase). | P2 |

### 2.15 Expansion & Integrations

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F73 | **Rent a car (Flexicars)** | Prompt option to rent a car for the trip; deep link or partner integration. | P2 |
| F74 | **Cameras / dashcam (Viktographix)** | Need for cameras / insurance; link to partner. | P2 |
| F75 | **Restaurant chain (e.g., Taruna)** | Optional partner for meal stops and rewards. | P2 |

### 2.16 B2B / Fleet (Future)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F76 | **Fleet / dispatcher view** | For small fleets: view drivers’ trips, planned rest/fuel, basic compliance. | P2 |
| F77 | **Trip export for reimbursement** | (See F12) PDF/link for expense reports. | P2 |

### 2.17 Group Trips

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F78 | **Group trip mode** | Two or more cars, same route; suggest meet-up stops (same gas/restaurant at same ETA). | P1 |

---

## 3. Detailed Feature Descriptions (Selected)

### 3.1 Meal-Time Restaurant Routing (F27–F29)

- User sets start time (or “leave now”). App computes ETA along the route.
- For each “meal window” (breakfast 6–9, lunch 11:30–13:30, dinner 18–20, or user-defined), find the user’s position at that time.
- Recommend restaurants within a small detour (e.g., 5–10 min) that match: meal type (breakfast vs lunch vs dinner), cuisine, veg/non-veg, price, fast food vs sit-down.
- Optionally re-route to hit a chosen restaurant, or show “Suggested stop: X in 45 min.”
- Chain logic: e.g., suggest IHOP/Starbucks for breakfast, not for dinner.

### 3.2 Rest Areas in Direction Only (F21–F22)

- Compute route polyline (origin → waypoints → destination).
- Filter rest areas to those that lie “ahead” along the route (e.g., within N miles of the path and after current position).
- Exclude rest areas on the opposite side of the highway or behind the driver.
- Sort by distance along route and show ETA, amenities, and safe-stop score if available.

### 3.3 Gas Station Stops (F18, F20)

- Inputs: tank capacity, current gas remaining (or %), city MPG, highway MPG (or blended).
- Compute “range remaining” and “miles to empty.”
- Along the route, place “must stop” before running out; prefer cheaper or partner stations within a safe buffer (e.g., refuel when remaining range &lt; 150 mi).
- Show next recommended gas stop and optional alternatives.

### 3.4 Corridor Weather (F44–F48)

- Fetch weather (and hazards) for a corridor along the route (e.g., next 2 hours of driving).
- Show: “Rain from Mile 80–120 in the next 90 min,” “Wind 25 mph at Mile 150.”
- Push alerts: “Heavy rain in ~45 min near Mile 120”; optional “Re-route to stay dry (+20 min).”
- Scheduled updates: e.g., every 1 hr (long trip) or 30 min (short trip); instant push for hazards.

### 3.5 “I’m Tired” / Need a Break (F25)

- One tap from nav or trip screen.
- Query: safe rest options (rest areas, truck stops, well-lit parking) within the next 10–15 minutes of driving.
- Sort by ETA and safe-stop score; show distance and “Get me there.”
- Optionally shorten next leg after rest (e.g., “Next rest in 2 hours” reminder).

### 3.6 Rewards (F64–F66)

- **Earn:** Choosing “fuel-efficient” route, stopping at partner gas/food, using eco-friendly stops, completing trips.
- **Who pays:** Fuel brands, restaurant partners, carbon/offset buyers, or subscription.
- **Redeem:** Fuel vouchers, partner discounts, car rental (e.g., Flexicars), carbon offset, or premium features.
- First phase: one partner and one redemption type; expand later.

---

## 4. Structured Workflow

### 4.1 High-Level App Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           xNovit App — High-Level Flow                        │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   ONBOARD    │     │  PLAN TRIP   │     │  ACTIVE      │     │  POST TRIP   │
  │   / SIGN UP  │────▶│  (Setup)    │────▶│  TRIP        │────▶│  / REWARDS   │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
        │                      │                     │                     │
        ▼                      ▼                     ▼                     ▼
  • Login/Register       • Origin/Dest           • Live nav            • Trip summary
  • Preferences          • Vehicle info          • Stops list          • Points earned
  • Notifications        • Trip type             • Alerts              • Export / Share
  • (Optional) Templates • Stops/Time            • “I’m tired”         • History
                         • Route pref             • Weather
                         • User type              • Meal/hotel prompts
                         • Calculate trip         • Rest area list
```

### 4.2 Trip Planning Workflow (Detailed)

```
START
  │
  ├─▶ Enter Origin (required)
  ├─▶ Enter Destination (required)
  ├─▶ [Optional] Add waypoints
  ├─▶ Select Trip Type: Round trip | One way
  ├─▶ Select Measurements: US | Metric
  ├─▶ Set Start time: Leave now | Schedule (date + time)
  │
  ├─▶ VEHICLE (if gas/EV relevant)
  │     ├─ Vehicle: Year → Make → Model → Trim
  │     ├─ Fuel type (or EV)
  │     ├─ City MPG, Highway MPG (or EV efficiency)
  │     ├─ Tank capacity (or battery capacity)
  │     └─ Current fuel/charge remaining
  │
  ├─▶ PREFERENCES
  │     ├─ User type: Trucker | Passenger (family/solo)
  │     ├─ Route: Fastest | Scenic | Most fuel-efficient (with time-of-day check)
  │     ├─ Restaurants: Fast food / Sit-down, Cuisine, Veg/Non-veg, Price range
  │     ├─ [Optional] Pet-friendly mode
  │     ├─ [Optional] Budget (trip budget)
  │     └─ [Optional] Trip template (Family / Solo / Trucker / EV)
  │
  ├─▶ CALCULATE TRIP
  │     • Resolve origin/dest/waypoints (geocoding)
  │     • Compute route (fastest/scenic/fuel-efficient)
  │     • Compute ETA at each segment
  │     • Fetch: rest areas, gas stations, restaurants (meal-time), hotels (overnight), weather corridor
  │     • Apply filters (direction, meal window, safe stop, pet, budget)
  │
  └─▶ TRIP RESULTS
        • Map + route
        • Timeline: legs, rest areas, gas, meals, hotels, weather
        • Estimated cost (if budget set)
        • [Start Trip] → Active Trip
```

### 4.3 Active Trip Workflow

```
ACTIVE TRIP
  │
  ├─▶ Navigation (in-app or handoff to Apple/Google Maps)
  │
  ├─▶ Timeline / Stops list
  │     • Next rest area, next gas, next meal, next hotel (if overnight)
  │     • Tap to navigate to stop or skip
  │
  ├─▶ Alerts & prompts (time- and location-based)
  │     • Weather: “Rain in 45 min near Mile 120”
  │     • Fatigue: “You’ve been driving 3 hours — rest in 15 min?”
  │     • Meal: “Breakfast stop in 20 min — IHOP at Exit 42”
  │     • Hotel: “Overnight window — Motel 6 in 30 min?”
  │     • “I’m tired” → nearest safe rest
  │
  ├─▶ Real-time (optional)
  │     • Road reports (rest area full, gas closed) in trip feed
  │     • Shared trip link (family sees ETA)
  │
  └─▶ End Trip
        • Mark trip complete
        • Summary: distance, duration, stops, cost
        • Points earned
        • Export / Share
        • Save to history (for “like last time”)
```

### 4.4 Safety & Emergency Workflow

```
EMERGENCY / “I’M TIRED”
  │
  ├─▶ “I’m tired” button
  │     • Find safe rest in next 10–15 min
  │     • Show list + navigate to chosen stop
  │     • Option: “Remind me to rest in 30 min”
  │
  └─▶ “I’ve broken down” button
        • Share live location (SMS/link to contact)
        • Show nearest: tow, mechanic, hospital
        • Optional: 911 / roadside assistance link
```

### 4.5 User Type–Driven Behavior

| User type | Rest areas | Gas | Restaurants | Hotels | Fun activities | HOS / Truck |
|-----------|------------|-----|-------------|--------|----------------|-------------|
| Trucker   | ✓ Full     | ✓ Diesel/truck stops | ✓ Meal-time | ✓ Overnight | ✗ Hidden     | ✓ Optional  |
| Passenger | ✓ Full     | ✓ Car gas    | ✓ Meal-time | ✓ Overnight | ✓ Shown      | —           |
| EV        | ✓ Full     | Charging stops | ✓ Meal-time | ✓ Overnight | By sub-type  | —           |

---

## 5. iOS Mobile Full-Stack Tech Stack

### 5.1 Overview

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Client (iOS)** | Swift, SwiftUI | Native performance, MapKit, background location, CarPlay potential |
| **Backend** | Node.js (or Go) + REST/GraphQL API | One codebase; good for real-time and integrations |
| **Database** | PostgreSQL + PostGIS | Relational + geographic queries (routes, POIs) |
| **Cache / sessions** | Redis | Sessions, rate limiting, real-time trip state |
| **Maps & routing** | Mapbox or Google Maps APIs | Routes, geocoding, ETA, traffic |
| **Weather** | Weather API (e.g., OpenWeather, Tomorrow.io) | Corridor weather, alerts |
| **POI data** | Custom + third-party (e.g., GasBuddy, OSM, commercial POI) | Rest areas, gas, restaurants, hotels |
| **Auth** | Auth0 or Firebase Auth / Custom JWT | Social + email; secure tokens |
| **Real-time** | WebSockets or SSE | Alerts, shared trip, road reports |
| **File storage** | S3-compatible (e.g., AWS S3, Cloudflare R2) | Export PDFs, assets |
| **DevOps** | CI/CD (GitHub Actions), containerized backend (Docker) | Reliable deploys |

### 5.2 iOS (Client) Stack — Recommended

| Concern | Choice | Notes |
|--------|--------|-------|
| **Language** | Swift 5.9+ | Modern concurrency (async/await), performance |
| **UI** | SwiftUI | Declarative, less code, good for maps and lists |
| **Minimum iOS** | iOS 16+ (or 17+) | Broad device support; 17 if you need latest MapKit |
| **Architecture** | MVVM or Clean (ViewModel + Use Cases) | Testable, clear separation |
| **State** | SwiftUI `@State` / `@Observable` + optional Combine | Local UI state; server state via async loaders |
| **Networking** | URLSession + async/await or Alamofire | REST/GraphQL client |
| **Maps** | MapKit (Apple) or Mapbox SDK (iOS) | MapKit: free, good iOS integration; Mapbox: more control, offline, custom style |
| **Location** | Core Location | Background location for active trip; request “always” only when needed |
| **Offline** | Local SQLite (e.g., GRDB) or Realm | Store downloaded route, stops, minimal weather |
| **Auth** | Native sign-in (Sign in with Apple), OAuth (Google) + secure token storage (Keychain) | Keychain for refresh tokens |
| **Push** | APNs (Apple Push Notification service) | Weather and hazard alerts, “rest in 15 min” |
| **Analytics** | Optional: Firebase Analytics or TelemetryDeck | Privacy-conscious event logging |
| **Testing** | XCTest, Swift Testing (new) | Unit + UI tests for critical flows |

**Optional for v1:** CarPlay (CarPlay App), Widgets (trip ETA, next stop).

### 5.3 Backend Stack — Recommended

| Concern | Choice | Notes |
|--------|--------|-------|
| **Runtime** | Node.js (LTS) or Go | Node: fast to ship, rich ecosystem; Go: performance, strong typing |
| **Framework** | Express (Node) or Gin (Go) | REST API; add GraphQL (e.g., Apollo) if you need flexible queries |
| **API style** | REST (primary) + WebSockets or SSE for alerts | REST: trip create, stops, user prefs; WS: live alerts, shared trip |
| **Database** | PostgreSQL 15+ | Reliable, JSONB for flexible fields, full-text search |
| **Spatial** | PostGIS extension | Rest areas “ahead on route,” corridor bounding box, nearest POI |
| **ORM / query** | Prisma (Node) or sqlc (Go) / GORM | Migrations, type-safe queries |
| **Cache** | Redis 7 | Session, rate limit, trip state, real-time presence |
| **Auth** | JWT (access + refresh); optional Auth0/Firebase for social | Validate tokens on every request |
| **Maps** | Mapbox Directions API or Google Directions + Routes API | Route, ETA, traffic |
| **Geocoding** | Mapbox Geocoding or Google Geocoding | Origin/dest/waypoints |
| **Weather** | OpenWeather One Call, Tomorrow.io, or NOAA | Corridor: request points along route; cache 15–30 min |
| **Jobs** | Bull (Node) or similar queue (Redis-backed) | Scheduled: weather refresh, trip reminders |
| **Hosting** | AWS (ECS + RDS + ElastiCache) or Railway / Render / Fly.io | Start with PaaS; move to ECS if you need more control |
| **File storage** | S3 or R2 | Trip export PDFs, static assets |

### 5.4 External Services & Data

| Need | Options |
|------|--------|
| **Rest areas** | State DOT APIs, OSM, commercial POI (e.g., HERE, Foursquare) |
| **Gas stations & prices** | GasBuddy API, Google Places, commercial fuel data |
| **Restaurants** | Google Places, Yelp, Foursquare; filter by meal type + opening hours |
| **Hotels** | Booking.com API, Google Places, Expedia (affiliate) |
| **Traffic** | Mapbox Traffic, Google Routes (traffic), HERE |
| **Weather** | OpenWeather, Tomorrow.io, NOAA (US); corridor = multiple points along route |
| **EV charging** | PlugShare, ChargePoint, Open Charge Map |

### 5.5 Security & Compliance

- **Auth:** HTTPS only; short-lived access tokens; refresh tokens in httpOnly cookie or secure storage.
- **Location:** Request only when needed; explain in app copy; support “while using” and “always” only for active trip.
- **PII:** Encrypt at rest (DB); do not log full location history long-term unless required for feature.
- **Compliance:** Consider CCPA/GDPR if you have EU/CA users; privacy policy and in-app consent.

### 5.6 Suggested Repository Structure

```
xNovit/
├── ios/                    # Swift/SwiftUI app
│   ├── xNovit/
│   │   ├── App/
│   │   ├── Features/
│   │   │   ├── TripPlan/
│   │   │   ├── ActiveTrip/
│   │   │   ├── Stops/
│   │   │   ├── Weather/
│   │   │   └── Profile/
│   │   ├── Core/
│   │   │   ├── Network/
│   │   │   ├── Location/
│   │   │   ├── Maps/
│   │   │   └── Storage/
│   │   └── Shared/
│   └── xNovitTests/
├── backend/                # Node or Go API
│   ├── src/
│   │   ├── routes/
│   │   ├── services/       # routing, weather, POI
│   │   ├── models/
│   │   └── middleware/
│   ├── prisma/             # or migrations/
│   └── package.json
├── docs/
│   └── PRODUCT_SPECIFICATION.md  # this document
└── README.md
```

---

## 6. Priority Summary for Build

- **P0 (Must-have for MVP):** Trip input (origin, dest, stops, time), vehicle & gas stops, rest areas (direction-only), meal-time restaurants, overnight hotels, route preference (scenic vs fast + time-of-day), trucker vs passenger + fun activities, corridor weather + alerts, “I’m tired,” emergency flow, rewards (basic), offline download.
- **P1 (Next):** Best time to leave, buffer time, trip templates, safe-stop quality, fatigue prompts, EV mode, order ahead / reservations, pet-friendly, budget mode, real-time reports, shared trip, audio brief, group trip, HOS (truckers).
- **P2 (Later):** Learn from past trips, 3D weather, challenges, wallet, Flexicars/Viktographix/Taruna, fleet view, referral rewards.

This document is the single source of truth for what xNovit does, how it flows, and what tech stack to use for the iOS mobile full-stack product.
