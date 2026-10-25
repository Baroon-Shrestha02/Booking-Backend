import mongoose from "mongoose";
import { VENUE_STATUSES, VENUE_TYPES } from "../../shared/constants/index.js";
import { createPublicId } from "../../shared/utils/ids.js";
import {
  closureSchema,
  locationSchema,
  operatingScheduleSchema,
  pricingSchema,
  venueImageSchema,
} from "./venue.subschemas.js";
import { attachVenueModelValidation } from "./venue.model.validation.js";

const venueSchema = new mongoose.Schema(
  {
    venueId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: () => createPublicId("ven"),
      match: /^ven_[a-f0-9]{24}$/,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
    },
    businessVerification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OwnerBusinessVerification",
      required: true,
      immutable: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    venueType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: Object.values(VENUE_TYPES),
    },
    images: {
      type: [venueImageSchema],
      required: true,
      validate: [
        {
          validator: (values) => values.length > 0,
          message: "At least one venue image is required",
        },
        {
          validator: (values) => values.length <= 12,
          message: "Venue images cannot exceed twelve",
        },
      ],
    },
    groundCount: { type: Number, required: true, min: 1, max: 100 },
    slotDurationMinutes: {
      type: Number,
      required: true,
      min: 15,
      max: 240,
      default: 60,
      validate: {
        validator: (value) => value % 15 === 0,
        message: "Slot duration must use 15-minute increments",
      },
    },
    location: { type: locationSchema, required: true },
    operatingSchedule: {
      type: operatingScheduleSchema,
      required: true,
      default: () => ({}),
    },
    closures: {
      type: [closureSchema],
      default: [],
      validate: {
        validator: (values) => values.length <= 100,
        message: "Venue closures cannot exceed one hundred entries",
      },
    },
    pricing: { type: pricingSchema, required: true },
    amenities: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 80 }],
      default: [],
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(VENUE_STATUSES),
      default: VENUE_STATUSES.DRAFT,
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

attachVenueModelValidation(venueSchema);

venueSchema.index({ "location.coordinates": "2dsphere" });
venueSchema.index({ owner: 1, status: 1, createdAt: -1 });

export default venueSchema;
