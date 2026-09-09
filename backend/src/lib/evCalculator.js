/**
 * Real math for where an EV should stop to charge along a trip.
 * Same idea as gasCalculator.js, but EVs are described differently:
 * range in miles + current charge as a percentage, instead of gallons + MPG.
 * Kept as its own file (some duplicated logic vs. gasCalculator.js) for simplicity.
 */

// Never let the battery drop below this fraction of a full charge before recharging.
const RESERVE_FRACTION = 0.15;

// Fallback for when the user doesn't know (or skips) their EV's exact range.
// A rough average for a modern EV — not accurate for any specific car.
// TODO: replace with a real Year/Make/Model lookup later, same as gasCalculator.js.
const DEFAULT_BATTERY_RANGE_MILES = 250;

/**
 * @param {object} input
 * @param {number} [input.batteryRangeMiles] - full range on a full charge (falls back to a typical average if not given)
 * @param {number} [input.currentChargePercent] - battery charge right now, 0-100 (defaults to full)
 * @param {number} input.totalDistanceMiles - total trip distance (required — cannot be guessed)
 * @returns {number[]} mile markers (distance from trip start) where a charging stop is needed
 */
export function calculateChargingStops({ batteryRangeMiles, currentChargePercent, totalDistanceMiles }) {
  // Only the route distance is truly required — that one can't be guessed at all.
  if (!totalDistanceMiles) return [];

  const fullRangeMiles = batteryRangeMiles ?? DEFAULT_BATTERY_RANGE_MILES;
  const reserveMiles = fullRangeMiles * RESERVE_FRACTION;

  // How far the car can go on ONE full charge before hitting the reserve cushion.
  const usableRangePerCharge = fullRangeMiles - reserveMiles;

  // How far the car can go RIGHT NOW, from its current charge, before hitting the reserve.
  const currentPercent = currentChargePercent ?? 100; // assume full if not given
  const currentUsableRange = (currentPercent / 100) * fullRangeMiles - reserveMiles;

  const stopMiles = [];
  let nextStopMile = currentUsableRange;

  // Keep adding a stop every "usableRangePerCharge" miles until we've covered the whole trip.
  while (nextStopMile > 0 && nextStopMile < totalDistanceMiles) {
    stopMiles.push(Math.round(nextStopMile));
    nextStopMile += usableRangePerCharge;
  }

  return stopMiles;
}
