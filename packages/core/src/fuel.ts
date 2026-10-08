/**
 * Fuel and charge range math, ported from the old backend's gasCalculator.js and
 * evCalculator.js. Gas and diesel share the same math.
 *
 * Model: every stop refills to full, and the car must never drop below `reservePercent`
 * of a full tank or battery. The M1 scheduler builds on `rangeFor()`; `fuelStopMiles()`
 * is the distance-only version, without the scheduler's lookahead margin.
 *
 * Fixes over the old calculators:
 * - Starting at or below the reserve now means "refuel at mile 0". The old code returned
 *   no stops at all, e.g. none for 10% fuel on a 900-mile trip.
 * - Stop miles round down, so a stop is never placed past the point where the reserve
 *   is reached. The old code rounded to the nearest mile, which could round up.
 * - Each stop is measured from the mile where the car actually refilled. The old code
 *   measured from the unrounded position, so later legs could run past the reserve.
 */
import type { Vehicle } from './schemas';

export interface Range {
  /** Miles on a full tank or battery. */
  fullMiles: number;
  /** Miles' worth of fuel or charge that must always stay in reserve. */
  reserveMiles: number;
  /** Miles the car can drive right now before reaching the reserve. Negative when already below it. */
  milesToReserve: number;
  /** Miles between stops after a full refill. */
  milesPerRefill: number;
}

export interface GasRangeInput {
  tankGallons: number;
  highwayMpg: number;
  fuelPercent: number;
  reservePercent: number;
}

export interface EvRangeInput {
  rangeMiles: number;
  chargePercent: number;
  reservePercent: number;
}

/** Guards against a typo (e.g. a 0.1-gallon tank) producing an enormous stop list. */
const MAX_STOPS = 500;

export function gasRange(input: GasRangeInput): Range {
  assertPositive('tankGallons', input.tankGallons);
  assertPositive('highwayMpg', input.highwayMpg);
  return buildRange(input.tankGallons * input.highwayMpg, input.fuelPercent, input.reservePercent);
}

export function evRange(input: EvRangeInput): Range {
  assertPositive('rangeMiles', input.rangeMiles);
  return buildRange(input.rangeMiles, input.chargePercent, input.reservePercent);
}

/** Range for a resolved vehicle (see `resolveTripRequest`, which fills in missing numbers). */
export function rangeFor(vehicle: Vehicle): Range {
  if (vehicle.fuel === 'ev') {
    return evRange({
      rangeMiles: required('rangeMiles', vehicle.rangeMiles),
      chargePercent: required('chargePercent', vehicle.chargePercent),
      reservePercent: vehicle.reservePercent,
    });
  }
  return gasRange({
    tankGallons: required('tankGallons', vehicle.tankGallons),
    highwayMpg: required('highwayMpg', vehicle.highwayMpg),
    fuelPercent: required('fuelPercent', vehicle.fuelPercent),
    reservePercent: vehicle.reservePercent,
  });
}

/**
 * Route miles (from the start) where the car must refuel or recharge so it never drops
 * below the reserve. A trip that ends exactly at the reserve needs no final stop.
 */
export function fuelStopMiles(range: Range, totalMiles: number): number[] {
  if (!Number.isFinite(totalMiles) || totalMiles < 0) {
    throw new RangeError(`totalMiles must be a non-negative number, got ${totalMiles}.`);
  }
  if (totalMiles / range.milesPerRefill > MAX_STOPS) {
    throw new RangeError(
      `This trip would need more than ${MAX_STOPS} fuel stops; check the vehicle's numbers.`,
    );
  }

  const stops: number[] = [];
  // At or below the reserve already: refuel before setting off.
  let next = Math.max(range.milesToReserve, 0);
  while (next < totalMiles) {
    const stop = Math.floor(next);
    stops.push(stop);
    next = stop + range.milesPerRefill;
  }
  return stops;
}

function buildRange(fullMiles: number, currentPercent: number, reservePercent: number): Range {
  assertPercent('current fuel or charge', currentPercent);
  assertPercent('reservePercent', reservePercent);
  if (reservePercent >= 100) {
    throw new RangeError('reservePercent must be below 100.');
  }
  return {
    fullMiles,
    reserveMiles: (fullMiles * reservePercent) / 100,
    milesToReserve: (fullMiles * (currentPercent - reservePercent)) / 100,
    milesPerRefill: (fullMiles * (100 - reservePercent)) / 100,
  };
}

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive number, got ${value}.`);
  }
}

function assertPercent(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError(`${name} must be between 0 and 100, got ${value}.`);
  }
}

function required(name: string, value: number | undefined): number {
  if (value === undefined) {
    throw new RangeError(`Vehicle is missing ${name}; run resolveTripRequest() first.`);
  }
  return value;
}
