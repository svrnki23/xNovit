# xNovit Backend API

Node.js backend for xNovit: **AI-powered trip planning**, nearest rest stops, emergency nearby, and rewards. Connects to the iOS app end-to-end.

## Features

- **POST /api/trips/calculate** — Calculate full trip from draft (origin, destination, vehicle, preferences). Uses **OpenAI** when `OPENAI_API_KEY` is set; otherwise deterministic fallback.
- **POST /api/stops/nearest-rest** — "I'm tired" flow: nearest safe rest stops (body: `{ "near": "current" }` or `{ "latitude", "longitude" }`).
- **POST /api/emergency/nearby** — Emergency: nearest hospitals, tows, police (body: `{ "latitude", "longitude" }`).
- **GET /api/rewards/balance** — User points balance.
- **POST /api/rewards/earn** — Credit points (body: `{ "points", "reason" }`).
- **POST /api/trips** — Save trip (body: full Trip JSON).
- **GET /api/trips** — List saved trips.

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env: set OPENAI_API_KEY for AI-generated trips and stops (optional)
npm install
npm run dev
```

Server runs at **http://127.0.0.1:3000** (or `PORT` in `.env`).

**Port already in use?** If you see `EADDRINUSE: address already in use :::3000`:
- Free the port: `lsof -ti:3000 | xargs kill`
- Or run on another port: `PORT=3001 npm run dev`, then set `XNOVIT_API_BASE=http://127.0.0.1:3001` in your Xcode scheme (Edit Scheme → Run → Arguments → Environment Variables).

## iOS connection

- The app uses **http://127.0.0.1:3000** by default (simulator).
- Override with environment variable `XNOVIT_API_BASE` (e.g. in Xcode scheme: `http://192.168.1.x:3000` for a physical device on the same network).
- Local networking is allowed via `NSAppTransportSecurity_AllowsLocalNetworking` in the iOS target.

## AI (OpenAI)

With `OPENAI_API_KEY` set:

- **Trip calculation** — GPT-4o-mini generates a full trip plan (rest areas, gas, meals, hotels, weather, fun activities) from origin, destination, and preferences.
- **Nearest rest** — AI suggests 2–4 safe rest stops near the given location.
- **Emergency** — AI returns realistic hospital, tow, and police options for the coordinates.

Without the key, the backend uses built-in fallback data so the app still works.
