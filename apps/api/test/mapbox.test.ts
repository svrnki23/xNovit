import { describe, expect, it } from 'vitest';
import { createMapboxClient, MapboxError } from '../src/services/mapbox';

/**
 * A fetch stand-in that records the requested URL and replies with `body`. These tests
 * check request building and error handling only; M1 adds recorded Mapbox fixtures.
 */
function fakeFetch(body: unknown, init: { status?: number; statusText?: string } = {}) {
  const requested: URL[] = [];
  const fetch = async (input: string | URL | Request) => {
    requested.push(new URL(input instanceof Request ? input.url : input));
    return new Response(JSON.stringify(body), { status: 200, ...init });
  };
  return { fetch: fetch as typeof globalThis.fetch, requested };
}

describe('geocode', () => {
  it('asks for one US or Canada match and flips Mapbox [lng, lat] order', async () => {
    const { fetch, requested } = fakeFetch({ features: [{ center: [-96.3344, 30.628] }] });
    const mapbox = createMapboxClient({ token: 'pk.secret', fetch });

    expect(await mapbox.geocode('College Station, TX')).toEqual({ lat: 30.628, lng: -96.3344 });

    const url = requested[0]!;
    expect(url.pathname).toBe('/geocoding/v5/mapbox.places/College%20Station%2C%20TX.json');
    expect(url.searchParams.get('country')).toBe('us,ca');
    expect(url.searchParams.get('limit')).toBe('1');
    expect(url.searchParams.get('access_token')).toBe('pk.secret');
  });

  it('returns null when nothing matches', async () => {
    const mapbox = createMapboxClient({ token: 'pk.secret', ...fakeFetch({ features: [] }) });
    expect(await mapbox.geocode('Nowhere')).toBeNull();
  });
});

describe('getRoute', () => {
  it('sends lng,lat pairs and converts meters and seconds to miles and minutes', async () => {
    const { fetch, requested } = fakeFetch({ routes: [{ distance: 160934.4, duration: 5400 }] });
    const mapbox = createMapboxClient({ token: 'pk.secret', fetch });

    const route = await mapbox.getRoute({ lat: 30.6, lng: -96.3 }, { lat: 32.8, lng: -96.8 });

    expect(route).toEqual({ distanceMiles: 100, durationMinutes: 90 });
    expect(requested[0]!.pathname).toBe('/directions/v5/mapbox/driving/-96.3,30.6;-96.8,32.8');
  });

  it('returns null when Mapbox finds no route', async () => {
    const mapbox = createMapboxClient({ token: 'pk.secret', ...fakeFetch({ routes: [] }) });
    expect(await mapbox.getRoute({ lat: 0, lng: 0 }, { lat: 1, lng: 1 })).toBeNull();
  });
});

describe('errors', () => {
  it('throws on an HTTP error without leaking the token', async () => {
    const failing = fakeFetch({}, { status: 401, statusText: 'Unauthorized' });
    const mapbox = createMapboxClient({ token: 'pk.secret', ...failing });
    const error = await mapbox.geocode('Austin').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(MapboxError);
    expect((error as Error).message).toBe('Mapbox geocoding failed: 401 Unauthorized');
    expect((error as Error).message).not.toContain('pk.secret');
  });

  it('throws on a response it does not recognize', async () => {
    const mapbox = createMapboxClient({ token: 'pk.secret', ...fakeFetch({ unexpected: true }) });
    await expect(mapbox.getRoute({ lat: 0, lng: 0 }, { lat: 1, lng: 1 })).rejects.toThrow(
      MapboxError,
    );
  });
});
