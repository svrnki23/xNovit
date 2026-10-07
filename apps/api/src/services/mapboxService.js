/**
 * Turns a place name (e.g. "Chicago, IL") into real coordinates using Mapbox.
 * Later: will also turn coordinates into a real driving route.
 */

// Secret key from .env — proves we're allowed to use Mapbox's API.
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

/**
 * @param {string} placeName - e.g. "Chicago, IL"
 * @returns {Promise<{ latitude: number, longitude: number } | null>}
 *   null if not found, or no token is set.
 */
export async function geocode(placeName) {
  // Nothing to do without a token or a place name.
  if (!MAPBOX_TOKEN || !placeName) return null;

  // encodeURIComponent makes the place name URL-safe.
  // limit=1 = just give us Mapbox's best match.
  // country=us,ca = only search North America, so an ambiguous name (e.g.
  // "St. Louis") can't accidentally match a same-named place overseas.
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(placeName)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=us,ca`;

  // fetch = send the request; await = wait for Mapbox's reply.
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Mapbox geocoding failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Take the first (only) result. ?.[0] avoids a crash if none came back.
  const firstMatch = data.features?.[0];
  if (!firstMatch) return null;

  // Mapbox returns [longitude, latitude] — reversed order, easy to mix up.
  const [longitude, latitude] = firstMatch.center;

  return { latitude, longitude };
}

const METERS_PER_MILE = 1609.344;

/**
 * Ask Mapbox for a real driving route between two coordinates.
 * @param {{ latitude: number, longitude: number }} origin
 * @param {{ latitude: number, longitude: number }} destination
 * @returns {Promise<{ distanceMiles: number, durationMinutes: number } | null>}
 *   null if no token is set, or Mapbox couldn't find a route.
 */
export async function getRoute(origin, destination) {
  if (!MAPBOX_TOKEN || !origin || !destination) return null;

  // Mapbox wants "longitude,latitude" pairs — reverse of how we store them.
  const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?access_token=${MAPBOX_TOKEN}&overview=false`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapbox directions failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const firstRoute = data.routes?.[0];
  if (!firstRoute) return null;

  // Mapbox gives distance in meters and duration in seconds — convert to
  // the units the rest of the app already uses (miles, minutes).
  return {
    distanceMiles: Math.round(firstRoute.distance / METERS_PER_MILE),
    durationMinutes: Math.round(firstRoute.duration / 60),
  };
}
