/**
 * API request/response shapes matching iOS Codable models.
 * All dates as ISO 8601 strings; UUIDs as strings.
 */

export const draftTripShape = {
  origin: { id: 'string', name: 'string', address: 'string|null', coordinate: { latitude: 0, longitude: 0 } | null },
  destination: { id: 'string', name: 'string', address: 'string|null', coordinate: null },
  waypoints: [],
  tripType: 'oneWay|roundTrip',
  startTime: 'ISO8601',
  leaveNow: true,
  vehicle: { year: 0, make: '', model: '', fuelType: '', cityMPG: 0, highwayMPG: 0, tankCapacityGallons: 0, fuelRemainingGallons: 0, isEV: false, batteryRangeMiles: 0, currentChargePercent: 0 } | null,
  preferences: { routePreference: '', mealType: '', diet: '', priceRange: '', petFriendly: false, budgetTotal: null, tripTemplate: null },
  userType: 'passenger|trucker',
  measurementSystem: 'us|metric'
};

export function newUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function stopPayload(type, name, opts = {}) {
  return {
    id: newUuid(),
    type,
    name,
    address: opts.address ?? null,
    coordinate: opts.coordinate ?? null,
    etaFromStart: opts.etaFromStart ?? null,
    distanceFromStartMiles: opts.distanceFromStartMiles ?? null,
    detourMinutes: opts.detourMinutes ?? null,
    metadata: opts.metadata ?? null
  };
}

export function weatherSegmentPayload(startMile, endMile, condition, severity = null, expectedAt = null) {
  return {
    id: newUuid(),
    startMile,
    endMile,
    condition,
    severity,
    expectedAt
  };
}
