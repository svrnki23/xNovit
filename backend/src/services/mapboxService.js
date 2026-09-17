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
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(placeName)}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

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
