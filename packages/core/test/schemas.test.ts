import { describe, expect, it } from 'vitest';
import {
  ClockTimeSchema,
  ItineraryItemSchema,
  PlaceOptionSchema,
  PlanSchema,
  resolveTripRequest,
  TripEventSchema,
  TripRequestInputSchema,
  TripRequestSchema,
  type ItineraryItem,
  type PlaceOption,
  type Plan,
} from '../src';
import { goldenTrip1 } from './requests';

/** A schema-valid option for shape tests only. It is not a real place and never leaves tests. */
const testOption: PlaceOption = {
  id: 'opt-1',
  source: 'manual',
  sourceId: 'test-only-1',
  name: 'Test option',
  lat: 31.5,
  lng: -97.1,
  category: 'fuel',
  detourMin: 3,
  openAtEta: null,
  amenities: [],
  links: {
    googleMaps: 'https://www.google.com/maps/search/?api=1&query=31.5,-97.1',
    appleMaps: 'https://maps.apple.com/?ll=31.5,-97.1',
  },
};

const departItem: ItineraryItem = {
  id: 'item-0',
  kind: 'depart',
  needs: [],
  routeMile: 0,
  etaUtc: '2026-11-25T12:00:00Z',
  localTime: '2026-11-25T06:00:00-06:00',
  tz: 'America/Chicago',
  dwellMin: 0,
  options: [],
  reason: 'Leave College Station.',
  locked: false,
  status: 'planned',
};

function minimalPlan(): Plan {
  return {
    tripId: 'trip-1',
    version: 1,
    createdAt: '2026-10-07T12:00:00Z',
    request: resolveTripRequest(goldenTrip1).request,
    route: { distanceMi: 0, durationMin: 0, polyline6: '' },
    days: [{ dayIndex: 0, date: '2026-11-25', items: [departItem] }],
    totals: {
      driveMin: 0,
      stopMin: 0,
      arriveAtLocal: '2026-11-25T06:00:00-06:00',
      overnights: 0,
    },
    assumptions: [],
    warnings: [],
  };
}

describe('TripRequestInputSchema', () => {
  it('accepts golden trip 1', () => {
    expect(TripRequestInputSchema.safeParse(goldenTrip1).success).toBe(true);
  });

  it('accepts a request without departAt (departure-suggestion mode)', () => {
    const { departAt: _omitted, ...rest } = goldenTrip1;
    expect(TripRequestInputSchema.safeParse(rest).success).toBe(true);
  });

  it('requires an explicit offset on departAt', () => {
    const result = TripRequestInputSchema.safeParse({
      ...goldenTrip1,
      departAt: '2026-11-25T06:00:00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects more drivers than adults', () => {
    const result = TripRequestInputSchema.safeParse({
      ...goldenTrip1,
      party: { ...goldenTrip1.party, adults: 1, drivers: 2 },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['party', 'drivers']);
  });

  it('rejects a meal window that closes before it opens', () => {
    const result = TripRequestInputSchema.safeParse({
      ...goldenTrip1,
      party: { ...goldenTrip1.party, mealWindows: { lunch: ['13:30', '11:30'] } },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a nap that ends before it starts', () => {
    const result = TripRequestInputSchema.safeParse({
      ...goldenTrip1,
      party: {
        ...goldenTrip1.party,
        children: [{ age: 2, nap: { start: '14:00', end: '13:00' } }],
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects out-of-range coordinates and percentages', () => {
    expect(
      TripRequestInputSchema.safeParse({
        ...goldenTrip1,
        origin: { ...goldenTrip1.origin, lat: 95 },
      }).success,
    ).toBe(false);
    expect(
      TripRequestInputSchema.safeParse({
        ...goldenTrip1,
        vehicle: { ...goldenTrip1.vehicle, fuelPercent: 120 },
      }).success,
    ).toBe(false);
  });
});

describe('TripRequestSchema (resolved)', () => {
  it('rejects a request whose defaults have not been filled in', () => {
    expect(TripRequestSchema.safeParse(goldenTrip1).success).toBe(false);
  });
});

describe('ClockTimeSchema', () => {
  it.each(['00:00', '08:30', '23:59'])('accepts %s', (time) => {
    expect(ClockTimeSchema.safeParse(time).success).toBe(true);
  });

  it.each(['24:00', '8:30', '08:60', '0830', ''])('rejects %j', (time) => {
    expect(ClockTimeSchema.safeParse(time).success).toBe(false);
  });
});

describe('PlaceOptionSchema', () => {
  it('accepts a sourced option', () => {
    expect(PlaceOptionSchema.safeParse(testOption).success).toBe(true);
  });

  it.each(['source', 'sourceId', 'lat', 'lng'] as const)('requires %s', (field) => {
    const { [field]: _dropped, ...rest } = testOption;
    expect(PlaceOptionSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects an empty sourceId', () => {
    expect(PlaceOptionSchema.safeParse({ ...testOption, sourceId: '' }).success).toBe(false);
  });

  it.each(['http://maps.apple.com/?ll=1,2', 'javascript:alert(1)'])(
    'rejects the non-https link %s',
    (link) => {
      const option = { ...testOption, links: { ...testOption.links, appleMaps: link } };
      expect(PlaceOptionSchema.safeParse(option).success).toBe(false);
    },
  );
});

describe('ItineraryItemSchema', () => {
  it('accepts a selected option that is one of the options', () => {
    const item = { ...departItem, options: [testOption], selectedOptionId: 'opt-1' };
    expect(ItineraryItemSchema.safeParse(item).success).toBe(true);
  });

  it('rejects a selected option that is not one of the options', () => {
    const item = { ...departItem, options: [testOption], selectedOptionId: 'opt-2' };
    expect(ItineraryItemSchema.safeParse(item).success).toBe(false);
  });

  it('requires etaUtc to be in UTC', () => {
    const item = { ...departItem, etaUtc: '2026-11-25T06:00:00-06:00' };
    expect(ItineraryItemSchema.safeParse(item).success).toBe(false);
  });
});

describe('PlanSchema', () => {
  it('accepts a minimal plan', () => {
    expect(PlanSchema.safeParse(minimalPlan()).success).toBe(true);
  });

  it('rejects a plan containing an option without a source', () => {
    const plan = minimalPlan();
    const { source: _dropped, ...unsourced } = testOption;
    plan.days[0]!.items[0] = { ...departItem, options: [unsourced as PlaceOption] };
    expect(PlanSchema.safeParse(plan).success).toBe(false);
  });

  it('rejects a plan with no days', () => {
    expect(PlanSchema.safeParse({ ...minimalPlan(), days: [] }).success).toBe(false);
  });
});

describe('TripEventSchema', () => {
  const event = { tripId: 'trip-1', type: 'stop_done', at: '2026-11-25T12:40:00-06:00' };

  it('accepts a known event type', () => {
    expect(TripEventSchema.safeParse(event).success).toBe(true);
  });

  it('rejects an unknown event type', () => {
    expect(TripEventSchema.safeParse({ ...event, type: 'points_earned' }).success).toBe(false);
  });
});
