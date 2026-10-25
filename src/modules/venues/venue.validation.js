import { z } from "zod";
import {
  VENUE_CLOSURE_TYPES,
  VENUE_STATUSES,
  VENUE_TYPES,
} from "../../shared/constants/index.js";

const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const jsonField = (schema) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }, schema);

const hours = z.object({ opensAt: time, closesAt: time }).strict();
const dayOverride = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isClosed: z.boolean().optional(),
    opensAt: time.nullable().optional(),
    closesAt: time.nullable().optional(),
  })
  .strict();

const operatingSchedule = z
  .object({
    defaultHours: hours.optional(),
    dayOverrides: z.array(dayOverride).max(7).optional(),
  })
  .strict();

const closure = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal(VENUE_CLOSURE_TYPES.SINGLE_DAY),
      date,
      reason: z.string().trim().max(200).nullable().optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal(VENUE_CLOSURE_TYPES.DATE_RANGE),
      startsOn: date,
      endsOn: date,
      reason: z.string().trim().max(200).nullable().optional(),
    })
    .strict(),
]);

const pricing = z
  .object({
    currency: z.literal("NPR").optional(),
    weekendDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
    periods: z
      .array(
        z
          .object({
            name: z.string().trim().min(2).max(40),
            startsAt: time,
            endsAt: time,
            weekdayPrice: z.number().min(0),
            weekendPrice: z.number().min(0),
          })
          .strict(),
      )
      .min(1)
      .max(12),
  })
  .strict();

const location = z
  .object({
    address: z.string().trim().min(1).max(250),
    coordinates: z
      .object({
        type: z.literal("Point").optional(),
        coordinates: z.tuple([
          z.number().min(-180).max(180),
          z.number().min(-90).max(90),
        ]),
      })
      .strict(),
  })
  .strict();

const ownerVenueStatuses = [
  VENUE_STATUSES.DRAFT,
  VENUE_STATUSES.ACTIVE,
  VENUE_STATUSES.INACTIVE,
];

const venueFields = {
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(2000),
  venueType: z.enum(Object.values(VENUE_TYPES)),
  groundCount: z.coerce.number().int().min(1).max(100),
  slotDurationMinutes: z.coerce
    .number()
    .int()
    .min(15)
    .max(240)
    .refine((value) => value % 15 === 0, {
      message: "Slot duration must use 15-minute increments",
    }),
  location: jsonField(location),
  operatingSchedule: jsonField(operatingSchedule).optional(),
  closures: jsonField(z.array(closure).max(100)).optional(),
  pricing: jsonField(pricing),
  amenities: jsonField(
    z.array(z.string().trim().min(1).max(80)).max(50),
  ).optional(),
  status: z.enum(ownerVenueStatuses).optional(),
};

const { status: _createStatus, ...createVenueFields } = venueFields;

export const createVenueSchema = {
  body: z.object(createVenueFields).strict(),
};

export const updateVenueSchema = {
  params: z
    .object({
      venueId: z.string().regex(/^ven_[a-f0-9]{24}$/),
    })
    .strict(),
  body: z.object(venueFields).partial().strict(),
};

export const venueIdSchema = {
  params: z
    .object({
      venueId: z.string().regex(/^ven_[a-f0-9]{24}$/),
    })
    .strict(),
};
