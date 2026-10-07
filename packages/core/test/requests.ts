import type { TripRequestInput } from '../src';

/**
 * Golden trip 1 from the build brief (section 10), as a client would send it.
 * Origin and destination are the cities' public coordinates. Meal style and the hotel
 * breakfast flag aren't specified in the brief, so they're set here for the test.
 */
export const goldenTrip1: TripRequestInput = {
  origin: { name: 'College Station, TX', lat: 30.628, lng: -96.3344 },
  destination: { name: 'Denver, CO', lat: 39.7392, lng: -104.9903 },
  departAt: '2026-11-25T06:00:00-06:00',
  vehicle: { fuel: 'gas', tankGallons: 19.5, highwayMpg: 28, fuelPercent: 60 },
  party: {
    adults: 2,
    drivers: 2,
    children: [{ age: 3, nap: { start: '13:00', end: '14:30' } }, { age: 7 }],
    dogs: 1,
    mealStyle: 'mixed',
    dailyDriveLimitMin: 600,
    latestArrival: '20:30',
  },
  hotelBreakfastCountsAsBreakfast: true,
};

/** Every defaultable field given explicitly, so nothing should be assumed. */
export const fullySpecified: TripRequestInput = {
  ...goldenTrip1,
  vehicle: { ...goldenTrip1.vehicle, reservePercent: 20 },
  party: {
    ...goldenTrip1.party,
    bathroomIntervalMin: 100,
    maxContinuousDriveMin: 150,
    mealWindows: {
      breakfast: ['07:00', '09:30'],
      lunch: ['12:00', '14:00'],
      dinner: ['18:00', '20:00'],
    },
    dailyDriveLimitMin: 540,
    earliestDepart: '06:00',
    latestArrival: '21:00',
    morningDepart: '07:30',
  },
};
