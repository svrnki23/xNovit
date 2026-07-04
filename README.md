# xNovit

Long-trip driving app: plan rest areas, gas, meals, hotels, and weather. Black & gold UI, 3D elements, AI-powered backend.

---

## How to run completely (backend + iOS)

### 1. Free port 3000 (if something is already using it)

```bash
lsof -ti:3000 | xargs kill
```

If you prefer to use another port instead, skip this and use `PORT=3001` in step 2, then set the env in step 4.

### 2. Start the backend

From the **project root** (the folder that contains `backend` and `xNovit`):

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

You should see: **xNovit API running at http://localhost:3000**

- **Optional:** Edit `backend/.env` and set `OPENAI_API_KEY=sk-...` for AI-generated trip plans and suggestions. Without it, the app still works with fallback data.

### 3. Open and run the iOS app

1. Open the Xcode project:
   - **File → Open** and choose **`xNovit/xNovit.xcodeproj`** (inside the `xNovit` folder).
2. Select a simulator (e.g. **iPhone 16**).
3. Press **Run** (⌘R).

The app talks to **http://127.0.0.1:3000** by default. Local networking is already allowed.

### 4. If you used a different port (e.g. 3001)

In Xcode:

1. **Product → Scheme → Edit Scheme…**
2. Select **Run** on the left.
3. Open the **Arguments** tab.
4. Under **Environment Variables**, click **+** and add:
   - **Name:** `XNOVIT_API_BASE`
   - **Value:** `http://127.0.0.1:3001` (or whatever port you used).

---

## What you can do

- **Splash → Onboarding → Home** — First launch flow.
- **Plan new trip** — Origin, destination, vehicle, preferences → **Calculate my trip** (hits the backend).
- **Start trip** → Active trip with next stops, weather, **I'm tired**, **Emergency** (all call the API).
- **End trip** → Summary, points earned; trip is saved to the backend.
- **Profile** — Rewards balance from the API.
- **My Trips** — Pull to refresh to load trips from the server.

---

## Project layout

| Path | Purpose |
|------|--------|
| **backend/** | Node.js API (Express). Trip calculation, nearest rest, emergency, rewards. See `backend/README.md`. |
| **xNovit/** | Xcode project and iOS app (Swift/SwiftUI). See `xNovit/ios/README.md`. |
| **docs/** | Product spec, workflows, tech stack. |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **Port 3000 already in use** | Run `lsof -ti:3000 \| xargs kill`, or start backend with `PORT=3001 npm run dev` and set `XNOVIT_API_BASE=http://127.0.0.1:3001` in the iOS scheme. |
| **“Check connection / backend running” in app** | Ensure the backend is running (`npm run dev` in `backend/`) and the app’s API base URL matches (default 3000 or your env). |
| **Physical device** | Set `XNOVIT_API_BASE=http://YOUR_MAC_IP:3000` in the scheme (e.g. `http://192.168.1.5:3000`). |
