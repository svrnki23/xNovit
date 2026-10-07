/**
 * Defaults for a trip request, and the plain-English assumption each one adds to a plan.
 * Build brief sections 4 and 5.3: every applied default must appear in `Plan.assumptions`.
 */
import type {
  Child,
  MealWindow,
  TravelParty,
  TravelPartyInput,
  TripRequest,
  TripRequestInput,
  Vehicle,
  VehicleInput,
} from './schemas';

export const PARTY_DEFAULTS = {
  maxContinuousDriveMin: 120,
  mealWindows: {
    breakfast: ['06:30', '09:00'],
    lunch: ['11:30', '13:30'],
    dinner: ['17:30', '19:30'],
  },
  dailyDriveLimitMin: 600,
  earliestDepart: '05:00',
  latestArrival: '20:30',
  morningDepart: '08:00',
} as const satisfies Omit<
  TravelParty,
  'adults' | 'drivers' | 'children' | 'dogs' | 'mealStyle' | 'bathroomIntervalMin'
>;

/**
 * Vehicle defaults. The reserve comes from the brief. The rest were carried over from the old
 * backend's calculators as rough averages for when a family doesn't know their numbers.
 */
export const VEHICLE_DEFAULTS = {
  reservePercent: 15,
  tankGallons: 14,
  highwayMpg: 25,
  fuelPercent: 100,
  rangeMiles: 250,
  chargePercent: 100,
} as const;

/** Section 5.3: youngest child under 4 → 90 min; under 10 → 120 min; otherwise 180 min. */
export function defaultBathroomIntervalMin(children: readonly Child[]): number {
  const youngest = Math.min(...children.map((child) => child.age));
  if (youngest < 4) return 90;
  if (youngest < 10) return 120;
  return 180;
}

/** 90 → "1 h 30 min", 120 → "2 h", 45 → "45 min". */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

export interface ResolvedTripRequest {
  request: TripRequest;
  /** One plain-English line per default applied, in a stable order. */
  assumptions: string[];
}

/** Fill in every missing default and record each one. Pure: the input is not modified. */
export function resolveTripRequest(input: TripRequestInput): ResolvedTripRequest {
  const assumptions: string[] = [];
  const request: TripRequest = {
    ...input,
    vehicle: resolveVehicle(input.vehicle, assumptions),
    party: resolveParty(input.party, assumptions),
  };
  return { request, assumptions };
}

type Fallback = <T>(given: T | undefined, fallback: T, assumption: string) => T;

function fallbackRecorder(assumptions: string[]): Fallback {
  return (given, fallback, assumption) => {
    if (given !== undefined) return given;
    assumptions.push(assumption);
    return fallback;
  };
}

function resolveVehicle(input: VehicleInput, assumptions: string[]): Vehicle {
  const use = fallbackRecorder(assumptions);
  const d = VEHICLE_DEFAULTS;
  const container = input.fuel === 'ev' ? 'battery' : 'tank';
  const vehicle: Vehicle = {
    ...input,
    reservePercent: use(
      input.reservePercent,
      d.reservePercent,
      `Keep at least ${d.reservePercent}% of a full ${container} in reserve (default).`,
    ),
  };

  if (input.fuel === 'ev') {
    vehicle.rangeMiles = use(
      input.rangeMiles,
      d.rangeMiles,
      `Full-charge range of ${d.rangeMiles} miles (a rough average; enter your car's range for a better plan).`,
    );
    vehicle.chargePercent = use(
      input.chargePercent,
      d.chargePercent,
      'Battery is fully charged at departure (no charge level given).',
    );
  } else {
    vehicle.tankGallons = use(
      input.tankGallons,
      d.tankGallons,
      `Tank holds ${d.tankGallons} gallons (a rough average; enter your car's tank size for a better plan).`,
    );
    vehicle.highwayMpg = use(
      input.highwayMpg,
      d.highwayMpg,
      `Highway fuel economy of ${d.highwayMpg} mpg (a rough average; enter your car's mpg for a better plan).`,
    );
    vehicle.fuelPercent = use(
      input.fuelPercent,
      d.fuelPercent,
      'Tank is full at departure (no fuel level given).',
    );
  }
  return vehicle;
}

function resolveParty(input: TravelPartyInput, assumptions: string[]): TravelParty {
  const use = fallbackRecorder(assumptions);
  const d = PARTY_DEFAULTS;

  const bathroomDefault = defaultBathroomIntervalMin(input.children);
  const bathroomIntervalMin = use(
    input.bathroomIntervalMin,
    bathroomDefault,
    `Bathroom break about every ${formatMinutes(bathroomDefault)} (${bathroomReason(input.children)}).`,
  );

  const maxContinuousDriveMin = use(
    input.maxContinuousDriveMin,
    d.maxContinuousDriveMin,
    `Stretch break after at most ${formatMinutes(d.maxContinuousDriveMin)} of continuous driving (default).`,
  );

  const meal = (name: 'breakfast' | 'lunch' | 'dinner', label: string): MealWindow => {
    const [opens, closes] = d.mealWindows[name];
    return use(
      input.mealWindows?.[name],
      [opens, closes],
      `${label} between ${opens} and ${closes} local time (default).`,
    );
  };
  const mealWindows = {
    breakfast: meal('breakfast', 'Breakfast'),
    lunch: meal('lunch', 'Lunch'),
    dinner: meal('dinner', 'Dinner'),
  };

  return {
    ...input,
    bathroomIntervalMin,
    maxContinuousDriveMin,
    mealWindows,
    dailyDriveLimitMin: use(
      input.dailyDriveLimitMin,
      d.dailyDriveLimitMin,
      `At most ${formatMinutes(d.dailyDriveLimitMin)} of driving per day (default).`,
    ),
    earliestDepart: use(
      input.earliestDepart,
      d.earliestDepart,
      `Leave no earlier than ${d.earliestDepart} (default).`,
    ),
    latestArrival: use(
      input.latestArrival,
      d.latestArrival,
      `Arrive no later than ${d.latestArrival} local time (default).`,
    ),
    morningDepart: use(
      input.morningDepart,
      d.morningDepart,
      `After an overnight stop, leave at ${d.morningDepart} (default).`,
    ),
  };
}

function bathroomReason(children: readonly Child[]): string {
  const interval = defaultBathroomIntervalMin(children);
  if (interval === 90) return 'default because the youngest child is under 4';
  if (interval === 120) return 'default because the youngest child is under 10';
  return children.length === 0 ? 'default with no children' : 'default with no children under 10';
}
