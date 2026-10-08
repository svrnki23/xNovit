import { describe, expect, it } from 'vitest';
import { evRange, fuelStopMiles, gasRange, rangeFor, type Range } from '../src';

/** Golden trip 1's minivan: 19.5 gal × 28 mpg = 546 miles on a full tank. */
const minivan = { tankGallons: 19.5, highwayMpg: 28, fuelPercent: 60, reservePercent: 15 };

describe('gasRange', () => {
  it('computes range from tank size, mpg, current fuel, and reserve', () => {
    const range = gasRange(minivan);
    expect(range.fullMiles).toBe(546);
    expect(range.reserveMiles).toBeCloseTo(81.9);
    expect(range.milesToReserve).toBeCloseTo(245.7);
    expect(range.milesPerRefill).toBeCloseTo(464.1);
  });

  it('rejects nonsense input', () => {
    expect(() => gasRange({ ...minivan, tankGallons: 0 })).toThrow(RangeError);
    expect(() => gasRange({ ...minivan, highwayMpg: Number.NaN })).toThrow(RangeError);
    expect(() => gasRange({ ...minivan, fuelPercent: 101 })).toThrow(RangeError);
    expect(() => gasRange({ ...minivan, reservePercent: 100 })).toThrow(RangeError);
  });
});

describe('evRange', () => {
  it('computes range from full range, charge, and reserve', () => {
    const range = evRange({ rangeMiles: 300, chargePercent: 80, reservePercent: 10 });
    expect(range).toEqual({
      fullMiles: 300,
      reserveMiles: 30,
      milesToReserve: 210,
      milesPerRefill: 270,
    });
  });
});

describe('rangeFor', () => {
  it('uses gas math for diesel', () => {
    const range = rangeFor({ fuel: 'diesel', ...minivan });
    expect(range).toEqual(gasRange(minivan));
  });

  it('uses EV math for an EV', () => {
    const range = rangeFor({ fuel: 'ev', rangeMiles: 300, chargePercent: 80, reservePercent: 10 });
    expect(range.milesToReserve).toBe(210);
  });

  it('refuses a vehicle whose defaults have not been resolved', () => {
    expect(() => rangeFor({ fuel: 'gas', reservePercent: 15 })).toThrow(/resolveTripRequest/);
  });
});

describe('fuelStopMiles', () => {
  it('stops when the tank reaches the reserve, then after each full refill', () => {
    // First stop at 245.7 mi (rounded down), then every 464.1 mi.
    expect(fuelStopMiles(gasRange(minivan), 950)).toEqual([245, 709]);
  });

  it('needs no stop when the trip ends before the reserve', () => {
    expect(fuelStopMiles(gasRange({ ...minivan, fuelPercent: 100 }), 400)).toEqual([]);
  });

  it('needs no final stop when the trip ends exactly at the reserve', () => {
    const range = evRange({ rangeMiles: 300, chargePercent: 80, reservePercent: 10 });
    expect(fuelStopMiles(range, 210)).toEqual([]);
  });

  it('refuels at mile 0 when already below the reserve', () => {
    // The old calculator returned no stops at all here.
    const range = gasRange({ ...minivan, fuelPercent: 10 });
    expect(fuelStopMiles(range, 900)).toEqual([0, 464]);
  });

  it('refuels at mile 0 when exactly at the reserve', () => {
    const range = gasRange({ ...minivan, fuelPercent: 15 });
    expect(fuelStopMiles(range, 100)).toEqual([0]);
  });

  it('has no stops for a zero-length trip', () => {
    expect(fuelStopMiles(gasRange({ ...minivan, fuelPercent: 5 }), 0)).toEqual([]);
  });

  it('rejects an invalid distance', () => {
    expect(() => fuelStopMiles(gasRange(minivan), -1)).toThrow(RangeError);
    expect(() => fuelStopMiles(gasRange(minivan), Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it('refuses to produce an absurd number of stops', () => {
    const tiny = gasRange({
      tankGallons: 0.01,
      highwayMpg: 1,
      fuelPercent: 100,
      reservePercent: 15,
    });
    expect(() => fuelStopMiles(tiny, 3000)).toThrow(/more than 500/);
  });

  describe('never lets fuel drop below the reserve, and never stops a mile early', () => {
    const cases: [number, number, number, number, number][] = [];
    for (const tankGallons of [8, 14, 19.5, 26])
      for (const highwayMpg of [18, 25, 28, 41])
        for (const fuelPercent of [16, 30, 60, 100])
          for (const reservePercent of [0, 10, 15, 25])
            for (const totalMiles of [50, 300, 950, 2000])
              cases.push([tankGallons, highwayMpg, fuelPercent, reservePercent, totalMiles]);

    it(`holds for ${cases.length} combinations`, () => {
      for (const [tankGallons, highwayMpg, fuelPercent, reservePercent, totalMiles] of cases) {
        const range = gasRange({ tankGallons, highwayMpg, fuelPercent, reservePercent });
        assertNeverBelowReserve(range, fuelStopMiles(range, totalMiles), totalMiles);
      }
    });
  });
});

/** Drive the route, refilling at each stop, and check the fuel level in miles. */
function assertNeverBelowReserve(range: Range, stops: number[], totalMiles: number): void {
  const epsilon = 1e-9;
  let fuelMiles = range.milesToReserve + range.reserveMiles;
  let position = 0;
  for (const stop of [...stops, totalMiles]) {
    fuelMiles -= stop - position;
    position = stop;
    // A car that starts below the reserve refuels at mile 0; nothing can be done before that.
    const startedBelowReserve = stop === 0 && range.milesToReserve <= 0;
    if (!startedBelowReserve) {
      expect(fuelMiles).toBeGreaterThanOrEqual(range.reserveMiles - epsilon);
    }
    if (stop !== totalMiles) {
      // Rounding down costs less than a mile; any earlier would be a wasted stop.
      expect(fuelMiles).toBeLessThan(range.reserveMiles + 1);
      fuelMiles = range.fullMiles;
    }
  }
}
