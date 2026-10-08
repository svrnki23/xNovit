> **Superseded on October 7, 2026.** The source of truth is now the build brief, [XNOVIT_BUILD_BRIEF.md](XNOVIT_BUILD_BRIEF.md). This document is kept for history only.

# xNovit — iOS Mobile Full-Stack Tech Stack

Quick reference for building the xNovit iOS app and backend. Full product context is in `PRODUCT_SPECIFICATION.md`.

---

## 1. Client: iOS (Native)

| Layer | Technology | Version / Notes |
|-------|------------|------------------|
| **Language** | Swift | 5.9+ |
| **UI** | SwiftUI | iOS 16+ (17+ for latest MapKit) |
| **Architecture** | MVVM or Clean (ViewModel + Use Cases) | — |
| **State** | `@State` / `@Observable`, async/await | Optional: Combine for streams |
| **Networking** | URLSession (native) or Alamofire | REST + optional GraphQL |
| **Maps** | MapKit (Apple) or Mapbox Maps SDK for iOS | Mapbox: offline, custom styling |
| **Routing / directions** | MapKit directions or Mapbox Directions API (from backend) | — |
| **Location** | Core Location | Background for active trip |
| **Offline storage** | SQLite (GRDB) or Realm | Downloaded route + stops |
| **Auth** | Sign in with Apple, OAuth (Google) | Keychain for tokens |
| **Push** | APNs (Apple Push Notifications) | Alerts, reminders |
| **Testing** | XCTest, Swift Testing | Unit + UI tests |

**Optional:** CarPlay extension, Widgets (trip ETA, next stop).

---

## 2. Backend

| Layer | Technology | Notes |
|-------|------------|--------|
| **Runtime** | Node.js (LTS) or Go | Node: fast iteration; Go: performance |
| **Framework** | Express (Node) or Gin (Go) | REST API |
| **API** | REST (primary) | Optional: GraphQL for flexible queries |
| **Real-time** | WebSockets or Server-Sent Events | Alerts, shared trip |
| **Database** | PostgreSQL 15+ | Primary data store |
| **Spatial** | PostGIS | “Ahead on route,” corridor, nearest POI |
| **ORM / queries** | Prisma (Node) or sqlc / GORM (Go) | Migrations, type safety |
| **Cache** | Redis 7 | Sessions, rate limit, trip state |
| **Auth** | JWT (access + refresh) | Optional: Auth0, Firebase for social |
| **Job queue** | Bull (Node) or Redis-based queue | Scheduled jobs (weather, reminders) |
| **File storage** | S3 or Cloudflare R2 | Trip PDFs, assets |
| **Hosting** | AWS (ECS, RDS, ElastiCache), Railway, Render, Fly.io | Start PaaS; scale to ECS if needed |

---

## 3. External APIs & Data

| Purpose | Options |
|---------|----------|
| **Maps & routing** | Mapbox Directions, Google Routes API |
| **Geocoding** | Mapbox Geocoding, Google Geocoding |
| **Rest areas** | State DOT APIs, OpenStreetMap, HERE / Foursquare |
| **Gas stations & prices** | GasBuddy API, Google Places |
| **Restaurants** | Google Places, Yelp, Foursquare (hours + filters) |
| **Hotels** | Booking.com API, Google Places, Expedia |
| **Weather** | OpenWeather One Call, Tomorrow.io, NOAA |
| **EV charging** | PlugShare, ChargePoint, Open Charge Map |
| **Traffic** | Mapbox Traffic, Google (with Routes) |

---

## 4. DevOps & Tooling

| Concern | Suggestion |
|---------|------------|
| **Version control** | Git (GitHub / GitLab) |
| **CI/CD** | GitHub Actions (build iOS, run tests, deploy backend) |
| **Backend deploy** | Docker containers; orchestration via ECS or PaaS |
| **Secrets** | Environment variables / AWS Secrets Manager / Vault |
| **Monitoring** | Logging (e.g., Datadog, CloudWatch); APM for API |
| **iOS distribution** | TestFlight (beta); App Store (release) |

---

## 5. Security Checklist

- HTTPS only; TLS 1.2+.
- Short-lived access tokens; refresh tokens stored securely (Keychain on iOS).
- Location: request only when needed; “always” only during active trip.
- PII: encrypt at rest; minimal retention for location history.
- Input validation and rate limiting on all public endpoints.
- Privacy policy and consent for location/data (CCPA/GDPR if applicable).

---

## 6. Suggested Repo Layout

```
xNovit/
├── ios/                    # Swift/SwiftUI
│   ├── xNovit/
│   │   ├── App/
│   │   ├── Features/       # TripPlan, ActiveTrip, Stops, Weather, Profile
│   │   ├── Core/           # Network, Location, Maps, Storage
│   │   └── Shared/
│   └── xNovitTests/
├── backend/                 # Node or Go
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   └── middleware/
│   ├── prisma/             # or migrations/
│   └── package.json       # or go.mod
├── docs/
│   ├── PRODUCT_SPECIFICATION.md
│   ├── WORKFLOWS.md
│   └── TECH_STACK.md
└── README.md
```

For full feature list, workflows, and product details, see `PRODUCT_SPECIFICATION.md` and `WORKFLOWS.md`.
