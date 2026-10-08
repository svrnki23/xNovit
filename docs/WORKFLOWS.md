> **Superseded on October 7, 2026.** The source of truth is now the build brief, [XNOVIT_BUILD_BRIEF.md](XNOVIT_BUILD_BRIEF.md). This document is kept for history only.

f# xNovit — Structured Workflows

This document details user flows and system workflows. The product spec (`PRODUCT_SPECIFICATION.md`) contains the full feature list and tech stack.

---

## 1. User Journey Map

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  DISCOVER          →    PLAN             →    DRIVE             →    ARRIVE / REFLECT   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  • Install app      │   • Enter route    │   • Follow nav       │   • Trip summary       │
│  • Sign up / Login  │   • Set vehicle    │   • See next stops   │   • Points earned      │
│  • Set preferences  │   • Set prefs      │   • Get meal/hotel   │   • Export / share     │
│  • (Optional)       │   • Calculate      │     prompts         │   • History            │
│    template         │   • Review plan    │   • Weather alerts   │   • “Like last time”   │
│                     │   • Start trip     │   • “I’m tired”      │                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Screen Flow (Simplified)

```
[SPLASH] → [ONBOARDING (first time)] → [HOME]

[HOME]
  ├─▶ [Plan New Trip] → [TRIP PLAN WIZARD] → [TRIP RESULTS] → [Start Trip] → [ACTIVE TRIP]
  ├─▶ [My Trips] → [TRIP HISTORY] → [Past trip detail] / [Use again]
  ├─▶ [Profile] → [Settings, Vehicle, Preferences, Rewards]
  └─▶ [Alerts] (if any)

[TRIP PLAN WIZARD] (steps)
  1. Origin & Destination (+ waypoints, trip type, units, start time)
  2. Vehicle (year, make, model, fuel type, MPG, tank, current fuel) — or skip for “just exploring”
  3. Preferences (user type, route, restaurant prefs, pet, budget, template)
  4. Calculate → [TRIP RESULTS]

[TRIP RESULTS]
  • Map + route
  • Timeline (rest, gas, meals, hotels, weather)
  • Edit / Recalculate
  • [Start Trip] → [ACTIVE TRIP]
  • [Download for offline]

[ACTIVE TRIP]
  • Map + ETA
  • Next stop cards (rest, gas, meal, hotel)
  • Alerts (weather, fatigue, meal prompt)
  • [I’m tired] → [Nearest safe rest]
  • [Emergency] → [Breakdown flow]
  • [End Trip] → [TRIP SUMMARY]

[TRIP SUMMARY]
  • Stats, cost, points
  • Export / Share
  • Save to history
```

---

## 3. Trip Calculation (Backend) Workflow

```
REQUEST: POST /trips/calculate
  Body: origin, destination, waypoints[], startTime, vehicle{}, preferences{}, userType

  1. GEOCODE
     • Resolve origin, destination, waypoints to coordinates.

  2. ROUTE
     • Call Mapbox/Google Directions with preference (fastest | scenic | fuel-efficient).
     • If scenic and time 11pm–4am (local), fallback to fastest.
     • Get: polyline, leg ETAs, total distance, duration.

  3. ENRICH ROUTE
     • Rest areas: PostGIS “rest areas ahead on route” (direction-only).
     • Gas: For each segment, compute “range remaining”; insert gas stops where range < threshold; prefer cheap/partner.
     • Restaurants: For each meal window (breakfast/lunch/dinner) based on start time + ETA, find segment; query POIs (restaurants) near segment; filter by meal type, cuisine, price, veg; rank by detour.
     • Hotels: If trip spans overnight (e.g., 10pm–6am), find segments in that window; query hotels near route; filter by price/rating.
     • Weather: Request weather for points along route (next 2–4 hours); build “corridor weather” and hazard list.

  4. APPLY FILTERS
     • User type: If trucker, exclude “fun activities” from response.
     • Pet-friendly: Filter rest areas and restaurants if pet mode on.
     • Budget: If set, sort/rank stops by cost; add estimated trip cost.

  5. RESPONSE
     • Route geometry, summary (distance, duration, cost estimate).
     • Stops: rest_areas[], gas_stops[], meal_stops[], hotel_stops[].
     • Weather: corridor summary + alerts.
     • Optional: fun_activities[] (if passenger).
```

---

## 4. Meal-Time Routing Logic (Detail)

```
INPUT: startTime, route (legs with ETA), meal windows (e.g. breakfast 6–9, lunch 11:30–13:30, dinner 18–20)

FOR each meal window:
  1. Find time range [T_start, T_end] in user’s local time (or trip time zone).
  2. From startTime + cumulative leg ETAs, find which segment the user is in during [T_start, T_end].
  3. Take midpoint of that segment (or user position at T_mid) as “search center.”
  4. Query restaurants near search center with:
     - open at T_mid (or opening hours overlap)
     - meal type matches (breakfast vs lunch vs dinner)
     - user prefs: cuisine, veg, price, fast food vs sit-down
  5. Rank by detour (minutes off route) and rating.
  6. Return top N (e.g., 3) per meal window.

OUTPUT: meal_stops[] with { mealType, suggestedTime, placeId, name, detourMinutes, ... }
```

---

## 5. Rest Areas “Direction Only” Logic

```
INPUT: route polyline (ordered points), current position (or trip start), rest area POIs (lat/lon)

  1. Project each rest area onto the route polyline (nearest point on line).
  2. Compute “distance along route” from trip start to that projected point.
  3. Keep only rest areas where distance_along_route > 0 (ahead) and, if applicable, same side of highway (optional heuristic: same side of route centerline).
  4. Sort by distance_along_route ascending.
  5. Optionally filter by amenities, safe-stop score, real-time status.

OUTPUT: rest_areas[] ordered by appearance along route.
```

---

## 6. Corridor Weather Workflow

```
INPUT: route geometry, start time, drive speed (or ETA per segment)

  1. Sample points along route (e.g., every 15 min of driving).
  2. For each point, get (lat, lon, time_at_point).
  3. Call weather API (batch or multiple calls) for those (lat, lon, time).
  4. Aggregate: “Rain from Mile 80–120, 11am–12pm”; “Wind 25 mph at Mile 150, 1pm.”
  5. Generate alerts: e.g., “Heavy rain in ~45 min near Mile 120.”
  6. Optional: suggest alternative route that avoids worst segment (and return time delta).

OUTPUT: corridor_weather (segments with conditions), alerts[], optional re_route_suggestion.
```

---

## 7. “I’m Tired” Flow

```
USER TAP: “I’m tired” / “Need a break”

  1. Get current location (and current route if in active trip).
  2. Query: rest areas, truck stops, safe parking within ~15 min drive (using current location or route-ahead).
  3. Filter: safe-stop score if available; 24/7; well-lit.
  4. Sort by ETA ascending.
  5. Show list: “Rest area in 8 min,” “Pilot in 12 min.”
  6. User selects → Navigate to chosen stop.
  7. Optional: Set reminder “Next rest in 2 hours” or “Remind me to rest in 30 min.”
```

---

## 8. Emergency / Breakdown Flow

```
USER TAP: “I’ve broken down”

  1. Get live location (high accuracy).
  2. Show actions:
     a. Share location (SMS/link to chosen contact).
     b. Nearest tow, mechanic, hospital (from POI or emergency API).
     c. Call 911 or roadside (tel: link).
  3. Optional: Notify backend for fleet or emergency partner (if B2B).
```

---

## 9. Rewards Earning (Simplified)

```
EVENTS THAT EARN POINTS (configurable):
  • Completed trip using “fuel-efficient” route.
  • Stopped at partner gas station.
  • Stopped at partner restaurant.
  • Chose eco-friendly stop (e.g., EV charging, low-emission route).
  • First trip, 5th trip, 10th trip (milestones).
  • Referral: invite accepted.

BACKEND:
  • On “End trip” or on stop check-in: evaluate events; credit points to user account.
  • Store in DB: user_id, points_balance, transaction_log (earn/redeem).
  • Redemption: user selects “Redeem for fuel voucher” (or similar); backend validates balance, calls partner if needed, deducts points.
```

---

## 10. Offline Download Workflow

```
USER TAP: “Download for offline”

  1. Request: route_id or trip_id (already calculated).
  2. Backend returns (or client already has): route geometry, list of stops (rest, gas, meals, hotels) with names, addresses, lat/lon, phone.
  3. Optionally: last-known corridor weather snapshot (or “weather not available offline”).
  4. Client stores in local DB (SQLite/Realm): route, stops.
  5. During active trip, if offline: show stored route and stops; navigation can use offline maps (Mapbox supports this) or cached tiles.
  6. When back online: sync completed trip, fetch fresh weather.
```

---

These workflows should be implemented as described in the product spec and refined during development. For tech stack and full feature list, see `PRODUCT_SPECIFICATION.md`.
