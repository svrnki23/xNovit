# @xnovit/api

The xNovit HTTP API: Express 5 and TypeScript, run with `tsx`. Every request body is validated with the shared schemas in `@xnovit/core`.

Run it from the repo root:

```bash
npm run dev
```

## Endpoints

Everything lives under `/api/v1`. An endpoint that isn't built yet validates its input and then answers `501 not_implemented`. It never returns placeholder data.

| Method | Path                           | Purpose                                       | Status   |
| ------ | ------------------------------ | --------------------------------------------- | -------- |
| `GET`  | `/health`                      | Health check                                  | Live     |
| `POST` | `/plans`                       | Create a trip and plan v1 from a trip request | 501 → M1 |
| `POST` | `/plans/departure-options`     | Top 3 departure times with explanations       | 501 → M1 |
| `GET`  | `/plans/:tripId`               | Latest plan (owner or share token)            | 501 → M3 |
| `POST` | `/plans/:tripId/replan`        | New plan version and what changed             | 501 → M4 |
| `POST` | `/plans/:tripId/items/:itemId` | Mark done or skipped, select an option, lock  | 501 → M4 |
| `POST` | `/plans/:tripId/events`        | Log trip events                               | 501 → M4 |
| `POST` | `/plans/:tripId/share`         | Create or revoke a share link                 | 501 → M3 |

Request body schemas are in [`packages/core/src/api.ts`](../../packages/core/src/api.ts).

## Errors

Every error has the same shape. Validation failures add `issues`:

```json
{
  "error": "invalid_request",
  "message": "The request body is invalid.",
  "issues": [{ "path": "departAt", "message": "Invalid ISO datetime" }]
}
```

## Configuration

Set these in the environment, or in `apps/api/.env` (copy [`.env.example`](.env.example)). An empty value means "not set", and the API still starts.

| Variable                    | Needed from | Purpose                                                 |
| --------------------------- | ----------- | ------------------------------------------------------- |
| `PORT`                      | —           | Port to listen on (default 3000; `0` picks a free port) |
| `NODE_ENV`                  | —           | `development` (default), `test`, or `production`        |
| `MAPBOX_TOKEN`              | M1          | Mapbox Directions and Geocoding                         |
| `SUPABASE_URL`              | M3          | Supabase project URL                                    |
| `SUPABASE_SERVICE_ROLE_KEY` | M3          | Server-only key. It never goes in the app.              |
| `BOOKING_AFFILIATE_ID`      | M4          | Added to hotel links when set                           |

## Layout

| Path                            | What it is                                                |
| ------------------------------- | --------------------------------------------------------- |
| `src/index.ts`                  | Loads config and starts the server                        |
| `src/app.ts`                    | `createApp()`: middleware, routes, 404 and error handling |
| `src/config.ts`                 | Environment loading and validation                        |
| `src/routes/v1.ts`              | The v1 routes                                             |
| `src/lib/http.ts`               | `sendError()` and `validateBody()`                        |
| `src/lib/supabase.ts`           | Server-side Supabase client (used from M3)                |
| `src/middleware/requireAuth.ts` | Verifies a Supabase access token (used from M3)           |
| `src/services/mapbox.ts`        | Mapbox geocoding and directions (extended in M1)          |

## Tests

`npm test` from the repo root, or `npm test -w @xnovit/api`. Tests use Supertest against `createApp()` and never touch the network. Outside calls go through an injected `fetch`.
