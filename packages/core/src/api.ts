/**
 * Request bodies for the v1 API (build brief, section 6). Responses use the section 4
 * types directly. Like the rest of the contract, these freeze after M1.
 */
import { z } from 'zod';
import {
  ItemStatusSchema,
  LatLngSchema,
  OffsetDateTimeSchema,
  PercentSchema,
  TripEventSchema,
  TripRequestInputSchema,
} from './schemas';

/** POST /plans */
export const CreatePlanRequestSchema = TripRequestInputSchema;

const MAX_DEPARTURE_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Candidate departure times to score (section 5.9). */
export const DepartureWindowSchema = z
  .object({
    from: OffsetDateTimeSchema,
    to: OffsetDateTimeSchema,
    /** Default 15. */
    stepMin: z.number().int().min(5).max(120).optional(),
  })
  .refine((window) => Date.parse(window.from) < Date.parse(window.to), {
    message: '`to` must be after `from`.',
    path: ['to'],
  })
  .refine((window) => Date.parse(window.to) - Date.parse(window.from) <= MAX_DEPARTURE_WINDOW_MS, {
    message: 'The departure window can be at most 24 hours long.',
    path: ['to'],
  });

/** POST /plans/departure-options */
export const DepartureOptionsRequestSchema = z.object({
  request: TripRequestInputSchema,
  window: DepartureWindowSchema,
});

/** POST /plans/:tripId/replan (section 5.10). */
export const ReplanRequestSchema = z.object({
  location: LatLngSchema,
  at: OffsetDateTimeSchema,
  fuelPercent: PercentSchema.optional(),
});

/** POST /plans/:tripId/items/:itemId: mark done or skipped, select an option, lock or unlock. */
export const UpdateItemRequestSchema = z
  .object({
    status: ItemStatusSchema.optional(),
    selectedOptionId: z.string().min(1).optional(),
    locked: z.boolean().optional(),
  })
  .refine(
    (update) =>
      update.status !== undefined ||
      update.selectedOptionId !== undefined ||
      update.locked !== undefined,
    { message: 'Send at least one of status, selectedOptionId, or locked.' },
  );

/** POST /plans/:tripId/events. The trip id comes from the URL. */
export const LogEventsRequestSchema = z.object({
  events: z
    .array(TripEventSchema.omit({ tripId: true }))
    .min(1)
    .max(100),
});

/** POST /plans/:tripId/share */
export const ShareRequestSchema = z.object({
  action: z.enum(['create', 'revoke']),
});

export type CreatePlanRequest = z.infer<typeof CreatePlanRequestSchema>;
export type DepartureWindow = z.infer<typeof DepartureWindowSchema>;
export type DepartureOptionsRequest = z.infer<typeof DepartureOptionsRequestSchema>;
export type ReplanRequest = z.infer<typeof ReplanRequestSchema>;
export type UpdateItemRequest = z.infer<typeof UpdateItemRequestSchema>;
export type LogEventsRequest = z.infer<typeof LogEventsRequestSchema>;
export type ShareRequest = z.infer<typeof ShareRequestSchema>;
