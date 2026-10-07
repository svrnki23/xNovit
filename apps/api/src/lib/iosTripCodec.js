/**
 * Normalize trip JSON so iOS Swift Codable models decode reliably.
 * Swift uses display-string raw values (e.g. TripType "One way", UserType "Passenger / Road tripper").
 */

import { newUuid } from './schemas.js';

const TRIP_TYPE_SWIFT = {
  oneWay: 'One way',
  oneway: 'One way',
  'one way': 'One way',
  'One way': 'One way',
  roundTrip: 'Round trip',
  roundtrip: 'Round trip',
  'round trip': 'Round trip',
  'Round trip': 'Round trip',
};

const USER_TYPE_SWIFT = {
  passenger: 'Passenger / Road tripper',
  Passenger: 'Passenger / Road tripper',
  'Passenger / Road tripper': 'Passenger / Road tripper',
  trucker: 'Trucker',
  Trucker: 'Trucker',
};

const FUEL_TYPE_SWIFT = {
  regular: 'Regular',
  premium: 'Premium',
  diesel: 'Diesel',
  electric: 'Electric',
  Regular: 'Regular',
  Premium: 'Premium',
  Diesel: 'Diesel',
  Electric: 'Electric',
};

const STOP_TYPE_SWIFT = {
  rest_area: 'restArea',
  restarea: 'restArea',
  restArea: 'restArea',
  gas_station: 'gas',
  gas: 'gas',
  meal: 'meal',
  hotel: 'hotel',
  fun_activity: 'funActivity',
  funactivity: 'funActivity',
  funActivity: 'funActivity',
  charging: 'charging',
};

function normalizeTripType(value, draft) {
  const raw = value ?? draft?.tripType;
  if (typeof raw === 'string') {
    const key = raw.replace(/\s+/g, '').toLowerCase();
    if (key.includes('round')) return 'Round trip';
    const mapped = TRIP_TYPE_SWIFT[key] ?? TRIP_TYPE_SWIFT[raw];
    if (mapped) return mapped;
  }
  return 'One way';
}

function normalizeUserType(value, draft) {
  const raw = value ?? draft?.userType;
  if (typeof raw === 'string') {
    const mapped = USER_TYPE_SWIFT[raw] ?? USER_TYPE_SWIFT[raw.toLowerCase()];
    if (mapped) return mapped;
  }
  return 'Passenger / Road tripper';
}

function normalizeFuelType(value, isEV) {
  // An EV with no fuelType given should default to "Electric", not "Regular".
  const fallback = isEV ? 'Electric' : 'Regular';
  if (typeof value !== 'string') return fallback;
  return FUEL_TYPE_SWIFT[value] ?? FUEL_TYPE_SWIFT[value.toLowerCase()] ?? fallback;
}

const SWIFT_STOP_TYPES = new Set(['restArea', 'gas', 'meal', 'hotel', 'funActivity', 'charging']);

function normalizeStopType(value) {
  if (typeof value !== 'string') return 'restArea';
  const mapped = STOP_TYPE_SWIFT[value] ?? STOP_TYPE_SWIFT[value.toLowerCase()];
  if (mapped) return mapped;
  return SWIFT_STOP_TYPES.has(value) ? value : 'restArea';
}

function normalizeVehicle(v) {
  if (!v || typeof v !== 'object') return null;
  return {
    ...v,
    fuelType: normalizeFuelType(v.fuelType, v.isEV === true),
  };
}

function normalizeStop(s) {
  if (!s || typeof s !== 'object') return s;
  const out = {
    ...s,
    id: s.id && String(s.id).includes('-') ? s.id : newUuid(),
    type: normalizeStopType(s.type),
  };
  return out;
}

function normalizeRoute(route) {
  if (!route || typeof route !== 'object') return route;
  const out = { ...route };
  if (Array.isArray(out.legs)) {
    const mapped = out.legs
      .filter((leg) => leg?.startCoordinate?.latitude != null && leg?.endCoordinate?.latitude != null)
      .map((leg) => ({
        id: leg?.id && String(leg.id).includes('-') ? leg.id : newUuid(),
        distanceMiles: Number(leg.distanceMiles) || 0,
        durationMinutes: Number(leg.durationMinutes) || 0,
        startCoordinate: leg.startCoordinate,
        endCoordinate: leg.endCoordinate,
      }));
    out.legs = mapped.length ? mapped : null;
  }
  return out;
}

function coerceTripTemplate(v) {
  const allowed = new Set(['Family road trip', 'Solo overnight', 'Trucker run', 'EV road trip']);
  if (v == null) return null;
  if (typeof v === 'string' && allowed.has(v)) return v;
  return null;
}

/**
 * @param {object} trip - trip object from AI or fallback
 * @param {object} draft - original request body (for fallbacks)
 */
export function normalizeTripForSwift(trip, draft = {}) {
  const out = { ...trip };

  out.id = out.id && String(out.id).includes('-') ? out.id : newUuid();
  out.tripType = normalizeTripType(out.tripType, draft);
  out.userType = normalizeUserType(out.userType, draft);
  out.preferences = { ...(out.preferences || {}), ...(draft.preferences || {}) };
  out.preferences.tripTemplate = coerceTripTemplate(out.preferences.tripTemplate);
  out.vehicle = normalizeVehicle(out.vehicle ?? draft.vehicle ?? null);

  ['restStops', 'gasStops', 'mealStops', 'hotelStops'].forEach((k) => {
    if (Array.isArray(out[k])) out[k] = out[k].map(normalizeStop);
  });
  if (Array.isArray(out.funActivities)) {
    out.funActivities = out.funActivities.map(normalizeStop);
  }
  if (out.route) out.route = normalizeRoute(out.route);
  return out;
}
