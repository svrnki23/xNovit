import { describe, expect, it } from 'vitest';
import {
  defaultBathroomIntervalMin,
  formatMinutes,
  resolveTripRequest,
  TripRequestSchema,
  type TripRequestInput,
} from '../src';
import { fullySpecified, goldenTrip1 } from './requests';

describe('resolveTripRequest', () => {
  it('fills every default for golden trip 1 and lists each one', () => {
    const { request, assumptions } = resolveTripRequest(goldenTrip1);

    expect(TripRequestSchema.safeParse(request).success).toBe(true);
    expect(request.vehicle.reservePercent).toBe(15);
    expect(request.party.bathroomIntervalMin).toBe(90);
    expect(request.party.maxContinuousDriveMin).toBe(120);
    expect(request.party.mealWindows).toEqual({
      breakfast: ['06:30', '09:00'],
      lunch: ['11:30', '13:30'],
      dinner: ['17:30', '19:30'],
    });
    expect(request.party.earliestDepart).toBe('05:00');
    expect(request.party.morningDepart).toBe('08:00');

    expect(assumptions).toEqual([
      'Keep at least 15% of a full tank in reserve (default).',
      'Bathroom break about every 1 h 30 min (default because the youngest child is under 4).',
      'Stretch break after at most 2 h of continuous driving (default).',
      'Breakfast between 06:30 and 09:00 local time (default).',
      'Lunch between 11:30 and 13:30 local time (default).',
      'Dinner between 17:30 and 19:30 local time (default).',
      'Leave no earlier than 05:00 (default).',
      'After an overnight stop, leave at 08:00 (default).',
    ]);
  });

  it('keeps values the family gave and assumes nothing', () => {
    const { request, assumptions } = resolveTripRequest(fullySpecified);
    expect(assumptions).toEqual([]);
    expect(request.party.bathroomIntervalMin).toBe(100);
    expect(request.vehicle.reservePercent).toBe(20);
  });

  it('defaults each meal window separately', () => {
    const input: TripRequestInput = {
      ...fullySpecified,
      party: { ...fullySpecified.party, mealWindows: { lunch: ['12:00', '13:00'] } },
    };
    const { request, assumptions } = resolveTripRequest(input);
    expect(request.party.mealWindows.lunch).toEqual(['12:00', '13:00']);
    expect(assumptions).toEqual([
      'Breakfast between 06:30 and 09:00 local time (default).',
      'Dinner between 17:30 and 19:30 local time (default).',
    ]);
  });

  it('assumes typical gas numbers when the family skips them', () => {
    const input: TripRequestInput = { ...fullySpecified, vehicle: { fuel: 'diesel' } };
    const { request, assumptions } = resolveTripRequest(input);
    expect(request.vehicle).toMatchObject({ tankGallons: 14, highwayMpg: 25, fuelPercent: 100 });
    expect(assumptions).toEqual([
      'Keep at least 15% of a full tank in reserve (default).',
      "Tank holds 14 gallons (a rough average; enter your car's tank size for a better plan).",
      "Highway fuel economy of 25 mpg (a rough average; enter your car's mpg for a better plan).",
      'Tank is full at departure (no fuel level given).',
    ]);
  });

  it('assumes EV numbers, not gas numbers, for an EV', () => {
    const input: TripRequestInput = { ...fullySpecified, vehicle: { fuel: 'ev', rangeMiles: 300 } };
    const { request, assumptions } = resolveTripRequest(input);
    expect(request.vehicle).toEqual({
      fuel: 'ev',
      rangeMiles: 300,
      chargePercent: 100,
      reservePercent: 15,
    });
    expect(assumptions).toEqual([
      'Keep at least 15% of a full battery in reserve (default).',
      'Battery is fully charged at departure (no charge level given).',
    ]);
  });

  it('does not modify its input', () => {
    const input = JSON.parse(JSON.stringify(goldenTrip1)) as TripRequestInput;
    resolveTripRequest(input);
    expect(input).toEqual(goldenTrip1);
  });

  it('is deterministic', () => {
    expect(resolveTripRequest(goldenTrip1)).toEqual(resolveTripRequest(goldenTrip1));
  });
});

describe('defaultBathroomIntervalMin', () => {
  it.each([
    [[3, 7], 90],
    [[0], 90],
    [[4], 120],
    [[9, 12], 120],
    [[10], 180],
    [[], 180],
  ])('youngest of %j → %i min', (ages, expected) => {
    expect(defaultBathroomIntervalMin(ages.map((age) => ({ age })))).toBe(expected);
  });

  it('explains the no-children default', () => {
    const input: TripRequestInput = {
      ...goldenTrip1,
      party: { ...goldenTrip1.party, children: [] },
    };
    expect(resolveTripRequest(input).assumptions).toContain(
      'Bathroom break about every 3 h (default with no children).',
    );
  });
});

describe('formatMinutes', () => {
  it.each([
    [45, '45 min'],
    [60, '1 h'],
    [90, '1 h 30 min'],
    [600, '10 h'],
  ])('%i → %s', (minutes, text) => {
    expect(formatMinutes(minutes)).toBe(text);
  });
});
