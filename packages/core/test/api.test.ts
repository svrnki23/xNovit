import { describe, expect, it } from 'vitest';
import {
  DepartureOptionsRequestSchema,
  LogEventsRequestSchema,
  ReplanRequestSchema,
  ShareRequestSchema,
  UpdateItemRequestSchema,
} from '../src';
import { goldenTrip1 } from './requests';

describe('DepartureOptionsRequestSchema', () => {
  // Golden trip 4: trip 1 in departure-suggestion mode, between 04:00 and 09:00.
  const { departAt: _omitted, ...request } = goldenTrip1;
  const window = { from: '2026-11-25T04:00:00-06:00', to: '2026-11-25T09:00:00-06:00' };

  it('accepts golden trip 4', () => {
    expect(DepartureOptionsRequestSchema.safeParse({ request, window }).success).toBe(true);
  });

  it('rejects a window that ends before it starts', () => {
    const backwards = { from: window.to, to: window.from };
    expect(DepartureOptionsRequestSchema.safeParse({ request, window: backwards }).success).toBe(
      false,
    );
  });

  it('rejects a window longer than 24 hours', () => {
    const long = { ...window, to: '2026-11-26T09:00:00-06:00' };
    expect(DepartureOptionsRequestSchema.safeParse({ request, window: long }).success).toBe(false);
  });
});

describe('ReplanRequestSchema', () => {
  it('accepts a location and time, with optional fuel', () => {
    const update = {
      location: { lat: 33.2, lng: -97.6 },
      at: '2026-11-25T15:30:00-06:00',
      fuelPercent: 40,
    };
    expect(ReplanRequestSchema.safeParse(update).success).toBe(true);
  });
});

describe('UpdateItemRequestSchema', () => {
  it('requires at least one change', () => {
    expect(UpdateItemRequestSchema.safeParse({}).success).toBe(false);
    expect(UpdateItemRequestSchema.safeParse({ status: 'done' }).success).toBe(true);
    expect(UpdateItemRequestSchema.safeParse({ locked: false }).success).toBe(true);
  });
});

describe('LogEventsRequestSchema', () => {
  it('takes one or more events without a trip id', () => {
    const events = [{ type: 'plan_viewed', at: '2026-11-25T05:50:00-06:00' }];
    expect(LogEventsRequestSchema.safeParse({ events }).success).toBe(true);
    expect(LogEventsRequestSchema.safeParse({ events: [] }).success).toBe(false);
  });
});

describe('ShareRequestSchema', () => {
  it('creates or revokes', () => {
    expect(ShareRequestSchema.safeParse({ action: 'create' }).success).toBe(true);
    expect(ShareRequestSchema.safeParse({ action: 'delete' }).success).toBe(false);
  });
});
