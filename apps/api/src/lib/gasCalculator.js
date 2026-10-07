/**
 * Real math for where a gas-powered vehicle should stop for fuel along a trip.
 * No AI, no external API — just arithmetic based on the vehicle's own numbers.
 */

// Never let the tank drop below this fraction of a full tank before refueling.
// e.g. 0.15 = always refuel with at least 15% of a full tank still left as a buffer.
const RESERVE_FRACTION = 0.15;

// Fallbacks for when the user doesn't know (or skips) their exact vehicle specs.
// These are rough averages, not accurate for any specific car — good enough to keep
// the feature working, not good enough to be the permanent answer.
// TODO: replace with a real Year/Make/Model lookup (see product spec F13) so we pull
// actual MPG (and, where available, tank size) instead of guessing. Tracked as a
// follow-up step — don't build it as part of this file.
const DEFAULT_HIGHWAY_MPG = 25;
const DEFAULT_TANK_CAPACITY_GALLONS = 14;

/**
 * @param {object} input
 * @param {number} [input.tankCapacityGallons] - full tank size (falls back to a typical average if not given)
 * @param {number} [input.fuelRemainingGallons] - fuel in the tank right now (defaults to full)
 * @param {number} [input.highwayMPG] - miles per gallon at highway speed (falls back to a typical average if not given)
 * @param {number} input.totalDistanceMiles - total trip distance (required — cannot be guessed)
 * @returns {number[]} mile markers (distance from trip start) where a gas stop is needed
 */
export function calculateGasStops({ tankCapacityGallons, fuelRemainingGallons, highwayMPG, totalDistanceMiles }) {
  // Only the route distance is truly required — that one can't be guessed at all.
  if (!totalDistanceMiles) return [];

  // Fall back to a reasonable average whenever a vehicle number is missing.
  const tankCapacity = tankCapacityGallons ?? DEFAULT_TANK_CAPACITY_GALLONS;
  const mpg = highwayMPG ?? DEFAULT_HIGHWAY_MPG;

  const fullTankRangeMiles = tankCapacity * mpg;
  const reserveMiles = fullTankRangeMiles * RESERVE_FRACTION;

  // How far the car can go on ONE full tank before hitting the reserve cushion.
  const usableRangePerFill = fullTankRangeMiles - reserveMiles;

  // How far the car can go RIGHT NOW, from its current fuel level, before hitting the reserve.
  const currentFuel = fuelRemainingGallons ?? tankCapacity; // assume full if not given
  const currentUsableRange = currentFuel * mpg - reserveMiles;

  const stopMiles = [];
  let nextStopMile = currentUsableRange;

  // Keep adding a stop every "usableRangePerFill" miles until we've covered the whole trip.
  while (nextStopMile > 0 && nextStopMile < totalDistanceMiles) {
    stopMiles.push(Math.round(nextStopMile));
    nextStopMile += usableRangePerFill;
  }

  return stopMiles;
}
