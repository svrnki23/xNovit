# xNovit Backend API

Node.js/Express backend for xNovit: real trip routing (Mapbox), real gas/EV
stop math, and real accounts/data (Supabase). AI (OpenAI) fills in the parts
that aren't real yet — rest areas, meal stops, hotels, weather — when
configured; otherwise built-in fallback data is used instead.

## Features

- **POST /api/trips/calculate** — Calculate a full trip from a draft
  (origin, destination, vehicle, preferences). Distance/duration come from
  real Mapbox geocoding + routing; gas/EV stops come from real math. Rest
  areas, meals, hotels, and weather use OpenAI when `OPENAI_API_KEY` is set,
  otherwise deterministic fallback data.
- **POST /api/stops/nearest-rest** — "I'm tired" flow: nearest safe rest stops.
- **POST /api/emergency/nearby** — Emergency: nearest hospitals, tows, police.
- **POST /api/auth/signup** — Create a real account (Supabase). Sends an
  email confirmation before the account can log in.
- **POST /api/auth/login** — Log in, returns a session token.
- **GET /api/rewards/balance** — Real per-user points balance.
- **POST /api/rewards/redeem** — Spend points (body: `{ "points", "type" }`).
  There's no "earn points" endpoint on purpose — see `rewards.js`.
- **POST /api/trips** — Save a trip to your account. Also awards points
  automatically.
- **GET /api/trips** — List your own saved trips.
- **GET /api/trips/:id** — Get one of your own saved trips.

## Setup

```bash
cd backend
cp .env.example .env
# Fill in .env — see "Environment variables" below
npm install
npm run dev
```

Server runs at **http://localhost:3000** (or `PORT` in `.env`). If 3000 is
already in use, it automatically falls back to 3001.

## Environment variables

| Variable | Required? | What it's for |
|---|---|---|
| `PORT` | No | Defaults to 3000 |
| `OPENAI_API_KEY` | No | AI-generated rest areas/meals/hotels/weather. Without it, built-in fallback data is used. |
| `MAPBOX_TOKEN` | Yes, for real routing | Real geocoding and driving distance/duration. Without it, trips fall back to fake placeholder numbers. |
| `SUPABASE_URL` | Yes | Your Supabase project's URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | See the important note below |
| `NODE_ENV` | No | `development` / `production` |

**Supabase key gotcha:** use the **legacy `service_role`** key (Supabase
dashboard → Settings → API Keys → "Legacy anon, service_role API keys" tab)
— not the newer `sb_secret_...` key shown on the default tab. The new-style
key doesn't reliably bypass Row Level Security.

## Running the full app

The actual frontend lives in `../app/` (Expo/React Native). Run both at once,
in two terminals:

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — app
cd app && npm run web
```

## AI (OpenAI)

With `OPENAI_API_KEY` set, OpenAI fills in rest areas, meal stops, hotels,
and weather with realistic-sounding (but not real) data. Trip
distance/duration and gas/EV stops are **always** real either way — OpenAI
is never involved in those.
