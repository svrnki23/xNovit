/**
 * Mapbox geocoding and driving directions. On failure these throw; callers report the
 * error and never substitute made-up places or routes.
 *
 * M1 extends getRoute() with full geometry (polyline6) and per-segment annotations.
 */
import type { LatLng } from '@xnovit/core';
import { z } from 'zod';

const API_BASE = 'https://api.mapbox.com';
const METERS_PER_MILE = 1609.344;

export interface RouteSummary {
  distanceMiles: number;
  durationMinutes: number;
}

export class MapboxError extends Error {
  override name = 'MapboxError';
}

const GeocodeResponseSchema = z.object({
  features: z.array(z.object({ center: z.tuple([z.number(), z.number()]) })),
});

const DirectionsResponseSchema = z.object({
  routes: z.array(z.object({ distance: z.number(), duration: z.number() })),
});

export interface MapboxClientOptions {
  token: string;
  /** Injected so tests never hit the network. */
  fetch?: typeof fetch;
}

export function createMapboxClient({ token, fetch: fetchImpl = fetch }: MapboxClientOptions) {
  async function getJson<T>(url: URL, schema: z.ZodType<T>, what: string): Promise<T> {
    url.searchParams.set('access_token', token);
    const response = await fetchImpl(url);
    // The URL holds the token, so error messages never include it.
    if (!response.ok) {
      throw new MapboxError(`Mapbox ${what} failed: ${response.status} ${response.statusText}`);
    }
    const parsed = schema.safeParse(await response.json());
    if (!parsed.success) {
      throw new MapboxError(`Mapbox ${what} returned an unexpected response.`);
    }
    return parsed.data;
  }

  return {
    /** Mapbox's best match for a place name, limited to the US and Canada; null if none. */
    async geocode(placeName: string): Promise<LatLng | null> {
      const url = new URL(
        `/geocoding/v5/mapbox.places/${encodeURIComponent(placeName)}.json`,
        API_BASE,
      );
      // Restricting to North America stops an ambiguous name like "St. Louis" from
      // matching a same-named place overseas.
      url.searchParams.set('country', 'us,ca');
      url.searchParams.set('limit', '1');
      const data = await getJson(url, GeocodeResponseSchema, 'geocoding');
      const first = data.features[0];
      if (!first) return null;
      // Mapbox orders coordinates [longitude, latitude].
      const [lng, lat] = first.center;
      return { lat, lng };
    },

    /** Distance and duration of the fastest driving route; null if Mapbox finds none. */
    async getRoute(origin: LatLng, destination: LatLng): Promise<RouteSummary | null> {
      const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
      const url = new URL(`/directions/v5/mapbox/driving/${coordinates}`, API_BASE);
      url.searchParams.set('overview', 'false');
      const data = await getJson(url, DirectionsResponseSchema, 'directions');
      const first = data.routes[0];
      if (!first) return null;
      return {
        distanceMiles: Math.round(first.distance / METERS_PER_MILE),
        durationMinutes: Math.round(first.duration / 60),
      };
    },
  };
}

export type MapboxClient = ReturnType<typeof createMapboxClient>;
