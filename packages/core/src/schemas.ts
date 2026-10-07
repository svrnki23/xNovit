/**
 * The xNovit data contract (build brief, section 4), shared by the API and the app.
 * After M1 this contract is frozen: changing it requires asking the founders.
 *
 * Request types come in two forms. `*InputSchema` is what a client may send, where
 * every field with a documented default is optional. The resolved schema (no suffix)
 * has those defaults filled in by `resolveTripRequest()`, which also records each
 * default it applied so the plan can list it in `assumptions`.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Primitives

/** A 24-hour local clock time, "HH:mm". Lexicographic order is chronological order. */
export const ClockTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected a 24-hour time like "08:30".');

/** An ISO 8601 instant with an explicit offset, e.g. "2026-11-25T06:00:00-06:00". */
export const OffsetDateTimeSchema = z.iso.datetime({ offset: true });

/** An ISO 8601 instant in UTC, e.g. "2026-11-25T12:00:00Z". */
export const UtcDateTimeSchema = z.iso.datetime();

/** A calendar date, "YYYY-MM-DD". */
export const IsoDateSchema = z.iso.date();

export const PercentSchema = z.number().min(0).max(100);

const MinutesSchema = z.number().int().positive();
const MINUTES_PER_DAY = 24 * 60;

/** Links shown to users must be https, which also rules out `javascript:` URLs. */
const HttpsUrlSchema = z.url({ protocol: /^https$/ });

export const LatLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const PlaceRefSchema = LatLngSchema.extend({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1).optional(),
});

// ---------------------------------------------------------------------------
// Vehicle

export const FuelTypeSchema = z.enum(['gas', 'diesel', 'ev']);

export const VehicleInputSchema = z.object({
  fuel: FuelTypeSchema,
  /** Gas or diesel. */
  tankGallons: z.number().positive().max(100).optional(),
  highwayMpg: z.number().positive().max(150).optional(),
  fuelPercent: PercentSchema.optional(),
  /** EV. */
  rangeMiles: z.number().positive().max(1000).optional(),
  chargePercent: PercentSchema.optional(),
  /** Never plan to drop below this share of a full tank or battery. Default 15. */
  reservePercent: z.number().min(0).max(50).optional(),
});

export const VehicleSchema = VehicleInputSchema.extend({
  reservePercent: z.number().min(0).max(50),
});

// ---------------------------------------------------------------------------
// Travel party

export const NapWindowSchema = z
  .object({ start: ClockTimeSchema, end: ClockTimeSchema })
  .refine((nap) => nap.start < nap.end, {
    message: 'A nap must end after it starts, on the same day.',
    path: ['end'],
  });

export const ChildSchema = z.object({
  age: z.number().int().min(0).max(17),
  nap: NapWindowSchema.optional(),
});

/** [opens, closes] in local time at the car's position. */
export const MealWindowSchema = z
  .tuple([ClockTimeSchema, ClockTimeSchema])
  .refine(([opens, closes]) => opens < closes, {
    message: 'A meal window must close after it opens.',
  });

export const MealWindowsSchema = z.object({
  breakfast: MealWindowSchema,
  lunch: MealWindowSchema,
  dinner: MealWindowSchema,
});

export const MealStyleSchema = z.enum(['fast', 'sitdown', 'mixed']);

const partyFields = {
  adults: z.number().int().min(1).max(12),
  drivers: z.number().int().min(1).max(12),
  children: z.array(ChildSchema).max(12),
  dogs: z.number().int().min(0).max(10),
  mealStyle: MealStyleSchema,
  dietNotes: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
};

const driversAreAdults = (party: { adults: number; drivers: number }) =>
  party.drivers <= party.adults;
const driversAreAdultsError = {
  message: 'Drivers must be adults, so there cannot be more drivers than adults.',
  path: ['drivers'],
};

export const TravelPartyInputSchema = z
  .object({
    ...partyFields,
    /** Default derived from the youngest child (section 5.3). */
    bathroomIntervalMin: MinutesSchema.optional(),
    /** Default 120. */
    maxContinuousDriveMin: MinutesSchema.optional(),
    /** Each meal defaults separately: breakfast 06:30–09:00, lunch 11:30–13:30, dinner 17:30–19:30. */
    mealWindows: z
      .object({
        breakfast: MealWindowSchema.optional(),
        lunch: MealWindowSchema.optional(),
        dinner: MealWindowSchema.optional(),
      })
      .optional(),
    /** Default 600. */
    dailyDriveLimitMin: MinutesSchema.max(MINUTES_PER_DAY).optional(),
    /** Default "05:00". */
    earliestDepart: ClockTimeSchema.optional(),
    /** Default "20:30", local time at the stop. */
    latestArrival: ClockTimeSchema.optional(),
    /** Default "08:00", used after an overnight. */
    morningDepart: ClockTimeSchema.optional(),
  })
  .refine(driversAreAdults, driversAreAdultsError);

export const TravelPartySchema = z
  .object({
    ...partyFields,
    bathroomIntervalMin: MinutesSchema,
    maxContinuousDriveMin: MinutesSchema,
    mealWindows: MealWindowsSchema,
    dailyDriveLimitMin: MinutesSchema.max(MINUTES_PER_DAY),
    earliestDepart: ClockTimeSchema,
    latestArrival: ClockTimeSchema,
    morningDepart: ClockTimeSchema,
  })
  .refine(driversAreAdults, driversAreAdultsError);

// ---------------------------------------------------------------------------
// Trip request

const tripFields = {
  origin: PlaceRefSchema,
  destination: PlaceRefSchema,
  /** Omit when asking for departure suggestions. */
  departAt: OffsetDateTimeSchema.optional(),
  hotelBreakfastCountsAsBreakfast: z.boolean(),
};

export const TripRequestInputSchema = z.object({
  ...tripFields,
  vehicle: VehicleInputSchema,
  party: TravelPartyInputSchema,
});

export const TripRequestSchema = z.object({
  ...tripFields,
  vehicle: VehicleSchema,
  party: TravelPartySchema,
});

// ---------------------------------------------------------------------------
// Places

/** Every place shown to a user carries its source and source id. Never fabricate one. */
export const PlaceSourceSchema = z.enum(['osm', 'mapbox', 'nrel', 'manual']);

export const PlaceCategorySchema = z.enum([
  'fuel',
  'ev_charger',
  'fast_food',
  'restaurant',
  'cafe',
  'rest_area',
  'services',
  'lodging',
  'playground',
  'dog_area',
]);

export const PlaceOptionSchema = LatLngSchema.extend({
  id: z.string().min(1),
  source: PlaceSourceSchema,
  sourceId: z.string().min(1),
  name: z.string().trim().min(1),
  category: PlaceCategorySchema,
  detourMin: z.number().nonnegative(),
  /** null means unknown. Never guess. */
  openAtEta: z.boolean().nullable(),
  amenities: z.array(z.string()),
  links: z.object({
    googleMaps: HttpsUrlSchema,
    appleMaps: HttpsUrlSchema,
    booking: HttpsUrlSchema.optional(),
  }),
});

// ---------------------------------------------------------------------------
// Itinerary and plan

export const StopNeedSchema = z.enum([
  'fuel',
  'charge',
  'breakfast',
  'lunch',
  'dinner',
  'bathroom',
  'stretch',
  'overnight',
]);

export const ItineraryItemKindSchema = z.enum(['depart', 'stop', 'overnight', 'arrive']);

export const ItemStatusSchema = z.enum(['planned', 'done', 'skipped']);

export const ItineraryItemSchema = z
  .object({
    id: z.string().min(1),
    kind: ItineraryItemKindSchema,
    /** One stop can combine several needs. */
    needs: z.array(StopNeedSchema),
    routeMile: z.number().nonnegative(),
    etaUtc: UtcDateTimeSchema,
    /** The same instant as `etaUtc`, written with the local offset at the stop. */
    localTime: OffsetDateTimeSchema,
    /** IANA time zone at the stop, e.g. "America/Chicago". */
    tz: z.string().min(1),
    dwellMin: z.number().int().nonnegative(),
    /** Ranked. Empty means "no verified place found here". */
    options: z.array(PlaceOptionSchema),
    selectedOptionId: z.string().min(1).optional(),
    /** Templated plain English, e.g. "Lunch window + fuel at 22% — combined stop". */
    reason: z.string(),
    /** e.g. a booked hotel. */
    locked: z.boolean(),
    status: ItemStatusSchema,
  })
  .refine(
    (item) =>
      item.selectedOptionId === undefined ||
      item.options.some((option) => option.id === item.selectedOptionId),
    {
      message: 'selectedOptionId must be the id of one of this item’s options.',
      path: ['selectedOptionId'],
    },
  );

export const PlanRouteSchema = z.object({
  distanceMi: z.number().nonnegative(),
  durationMin: z.number().nonnegative(),
  polyline6: z.string(),
});

export const PlanDaySchema = z.object({
  dayIndex: z.number().int().nonnegative(),
  date: IsoDateSchema,
  items: z.array(ItineraryItemSchema),
});

export const PlanTotalsSchema = z.object({
  driveMin: z.number().nonnegative(),
  stopMin: z.number().nonnegative(),
  /** Arrival instant written with the destination's local offset. */
  arriveAtLocal: OffsetDateTimeSchema,
  overnights: z.number().int().nonnegative(),
});

export const PlanSchema = z.object({
  tripId: z.string().min(1),
  version: z.number().int().positive(),
  createdAt: UtcDateTimeSchema,
  request: TripRequestSchema,
  route: PlanRouteSchema,
  days: z.array(PlanDaySchema).min(1),
  totals: PlanTotalsSchema,
  /** Every default applied, in plain English. */
  assumptions: z.array(z.string()),
  /** e.g. "No verified fuel between mile 310 and mile 420". */
  warnings: z.array(z.string()),
});

export const PlanChangeSchema = z.object({
  itemId: z.string().min(1),
  what: z.enum(['moved', 'added', 'removed', 'option_changed']),
  before: z.string().optional(),
  after: z.string().optional(),
  /** e.g. "Lunch moved from Temple (12:10) to Waco (12:55)". */
  summary: z.string().min(1),
});

export const HotelConflictSchema = z.object({
  lockedItemId: z.string().min(1),
  reason: z.string().min(1),
  alternatives: z.array(PlaceOptionSchema),
});

export const PlanDiffSchema = z.object({
  changes: z.array(PlanChangeSchema),
  hotelConflict: HotelConflictSchema.optional(),
});

// ---------------------------------------------------------------------------
// Events

export const TripEventTypeSchema = z.enum([
  'plan_viewed',
  'replan_requested',
  'stop_navigated',
  'stop_done',
  'stop_skipped',
  'hotel_link_clicked',
  'feedback',
]);

export const TripEventSchema = z.object({
  tripId: z.string().min(1),
  type: TripEventTypeSchema,
  at: OffsetDateTimeSchema,
  itemId: z.string().min(1).optional(),
  /** Location is stored only when attached to an event or a replan; never continuously. */
  location: LatLngSchema.optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Types

export type ClockTime = z.infer<typeof ClockTimeSchema>;
export type LatLng = z.infer<typeof LatLngSchema>;
export type PlaceRef = z.infer<typeof PlaceRefSchema>;
export type FuelType = z.infer<typeof FuelTypeSchema>;
export type VehicleInput = z.infer<typeof VehicleInputSchema>;
export type Vehicle = z.infer<typeof VehicleSchema>;
export type Child = z.infer<typeof ChildSchema>;
export type MealWindow = z.infer<typeof MealWindowSchema>;
export type MealWindows = z.infer<typeof MealWindowsSchema>;
export type MealStyle = z.infer<typeof MealStyleSchema>;
export type TravelPartyInput = z.infer<typeof TravelPartyInputSchema>;
export type TravelParty = z.infer<typeof TravelPartySchema>;
export type TripRequestInput = z.infer<typeof TripRequestInputSchema>;
export type TripRequest = z.infer<typeof TripRequestSchema>;
export type PlaceSource = z.infer<typeof PlaceSourceSchema>;
export type PlaceCategory = z.infer<typeof PlaceCategorySchema>;
export type PlaceOption = z.infer<typeof PlaceOptionSchema>;
export type StopNeed = z.infer<typeof StopNeedSchema>;
export type ItineraryItemKind = z.infer<typeof ItineraryItemKindSchema>;
export type ItemStatus = z.infer<typeof ItemStatusSchema>;
export type ItineraryItem = z.infer<typeof ItineraryItemSchema>;
export type PlanRoute = z.infer<typeof PlanRouteSchema>;
export type PlanDay = z.infer<typeof PlanDaySchema>;
export type PlanTotals = z.infer<typeof PlanTotalsSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type PlanChange = z.infer<typeof PlanChangeSchema>;
export type HotelConflict = z.infer<typeof HotelConflictSchema>;
export type PlanDiff = z.infer<typeof PlanDiffSchema>;
export type TripEventType = z.infer<typeof TripEventTypeSchema>;
export type TripEvent = z.infer<typeof TripEventSchema>;
