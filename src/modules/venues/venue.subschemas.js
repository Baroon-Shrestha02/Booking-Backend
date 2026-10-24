import mongoose from "mongoose";
import { VENUE_CLOSURE_TYPES } from "../../shared/constants/index.js";
import { createPublicId } from "../../shared/utils/ids.js";
import { datePattern, timePattern } from "./venue.model.validation.js";

const withoutIds = { _id: false };

export const venueImageSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, trim: true },
    publicUrl: {
      type: String,
      required: true,
      trim: true,
      match: /^https:\/\//,
    },
    isCover: { type: Boolean, default: false },
    sortOrder: { type: Number, min: 0, default: 0 },
  },
  withoutIds,
);

const hoursSchema = new mongoose.Schema(
  {
    opensAt: { type: String, required: true, match: timePattern },
    closesAt: { type: String, required: true, match: timePattern },
  },
  withoutIds,
);

const dayOverrideSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    isClosed: { type: Boolean, default: false },
    opensAt: { type: String, default: null, match: timePattern },
    closesAt: { type: String, default: null, match: timePattern },
  },
  withoutIds,
);

export const operatingScheduleSchema = new mongoose.Schema(
  {
    defaultHours: {
      type: hoursSchema,
      required: true,
      default: () => ({ opensAt: "08:00", closesAt: "21:00" }),
    },
    dayOverrides: {
      type: [dayOverrideSchema],
      default: [],
      validate: {
        validator: (values) => values.length <= 7,
        message: "Operating-hour overrides cannot exceed seven days",
      },
    },
  },
  withoutIds,
);

export const closureSchema = new mongoose.Schema(
  {
    closureId: {
      type: String,
      required: true,
      immutable: true,
      default: () => createPublicId("cls"),
      match: /^cls_[a-f0-9]{24}$/,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(VENUE_CLOSURE_TYPES),
    },
    date: { type: String, default: null, match: datePattern },
    startsOn: { type: String, default: null, match: datePattern },
    endsOn: { type: String, default: null, match: datePattern },
    reason: { type: String, trim: true, maxlength: 200, default: null },
  },
  withoutIds,
);

const pricingPeriodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 40,
    },
    startsAt: { type: String, required: true, match: timePattern },
    endsAt: { type: String, required: true, match: timePattern },
    weekdayPrice: { type: Number, required: true, min: 0 },
    weekendPrice: { type: Number, required: true, min: 0 },
  },
  withoutIds,
);

export const pricingSchema = new mongoose.Schema(
  {
    currency: {
      type: String,
      required: true,
      enum: ["NPR"],
      default: "NPR",
    },
    weekendDays: {
      type: [{ type: Number, min: 0, max: 6 }],
      default: [6],
    },
    periods: {
      type: [pricingPeriodSchema],
      required: true,
      validate: [
        {
          validator: (values) => values.length > 0,
          message: "At least one pricing period is required",
        },
        {
          validator: (values) => values.length <= 12,
          message: "Pricing periods cannot exceed twelve",
        },
      ],
    },
  },
  withoutIds,
);

const geoPointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (values) => {
          if (!Array.isArray(values) || values.length !== 2) return false;
          const [longitude, latitude] = values;
          return (
            longitude >= -180 &&
            longitude <= 180 &&
            latitude >= -90 &&
            latitude <= 90
          );
        },
        message: "Coordinates must contain valid longitude and latitude",
      },
    },
  },
  withoutIds,
);

export const locationSchema = new mongoose.Schema(
  {
    address: { type: String, required: true, trim: true, maxlength: 250 },
    area: { type: String, required: true, trim: true, maxlength: 100 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    landmark: { type: String, trim: true, maxlength: 160, default: null },
    coordinates: { type: geoPointSchema, required: true },
  },
  withoutIds,
);
