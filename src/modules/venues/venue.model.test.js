import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Venue from "./venue.model.js";
import {
  VENUE_CLOSURE_TYPES,
  VENUE_STATUSES,
  VENUE_TYPES,
} from "../../shared/constants/index.js";

const validVenue = () => ({
  owner: new mongoose.Types.ObjectId(),
  businessVerification: new mongoose.Types.ObjectId(),
  name: "KhelYard Futsal Arena",
  description: "Indoor futsal venue with three covered playing grounds.",
  venueType: VENUE_TYPES.FUTSAL,
  images: [
    {
      publicId: "khelyard/venues/example/cover",
      publicUrl: "https://res.cloudinary.com/example/image/upload/cover.jpg",
      isCover: true,
    },
  ],
  groundCount: 3,
  location: {
    address: "New Baneshwor",
    coordinates: {
      type: "Point",
      coordinates: [85.3432, 27.6915],
    },
  },
  pricing: {
    currency: "NPR",
    weekendDays: [6],
    periods: [
      {
        name: "morning",
        startsAt: "08:00",
        endsAt: "12:00",
        weekdayPrice: 1200,
        weekendPrice: 1500,
      },
      {
        name: "day",
        startsAt: "12:00",
        endsAt: "17:00",
        weekdayPrice: 1600,
        weekendPrice: 1900,
      },
      {
        name: "evening",
        startsAt: "17:00",
        endsAt: "21:00",
        weekdayPrice: 2200,
        weekendPrice: 2600,
      },
    ],
  },
});

test("creates a draft venue with simplified grounds and default hours", async () => {
  const venue = new Venue(validVenue());
  await venue.validate();

  assert.match(venue.venueId, /^ven_[a-f0-9]{24}$/);
  assert.equal(venue.status, VENUE_STATUSES.DRAFT);
  assert.equal(venue.groundCount, 3);
  assert.equal(venue.operatingSchedule.defaultHours.opensAt, "08:00");
  assert.equal(venue.operatingSchedule.defaultHours.closesAt, "21:00");
});

test("accepts single-day and inclusive date-range closures", async () => {
  const venue = new Venue({
    ...validVenue(),
    closures: [
      {
        type: VENUE_CLOSURE_TYPES.SINGLE_DAY,
        date: "2026-10-30",
        reason: "Private event",
      },
      {
        type: VENUE_CLOSURE_TYPES.DATE_RANGE,
        startsOn: "2026-11-01",
        endsOn: "2026-11-05",
        reason: "Tihar holiday",
      },
    ],
  });

  await venue.validate();
  assert.equal(venue.closures.length, 2);
  assert.match(venue.closures[0].closureId, /^cls_[a-f0-9]{24}$/);
});

test("rejects overlapping venue closures", async () => {
  const venue = new Venue({
    ...validVenue(),
    closures: [
      {
        type: VENUE_CLOSURE_TYPES.DATE_RANGE,
        startsOn: "2026-11-01",
        endsOn: "2026-11-05",
      },
      {
        type: VENUE_CLOSURE_TYPES.SINGLE_DAY,
        date: "2026-11-05",
      },
    ],
  });

  await assert.rejects(venue.validate(), /Venue closures cannot overlap/);
});

test("rejects overlapping pricing periods", async () => {
  const data = validVenue();
  data.pricing.periods[1].startsAt = "11:00";
  const venue = new Venue(data);

  await assert.rejects(venue.validate(), /Pricing periods cannot overlap/);
});

test("supports flexible weekday overrides", async () => {
  const venue = new Venue({
    ...validVenue(),
    operatingSchedule: {
      defaultHours: { opensAt: "08:00", closesAt: "21:00" },
      dayOverrides: [
        {
          dayOfWeek: 6,
          opensAt: "07:00",
          closesAt: "22:00",
        },
        { dayOfWeek: 1, isClosed: true },
      ],
    },
  });

  await venue.validate();
  assert.equal(venue.operatingSchedule.dayOverrides.length, 2);
});

test("reports missing pricing times as validation errors", async () => {
  const data = validVenue();
  delete data.pricing.periods[0].startsAt;
  const venue = new Venue(data);

  await assert.rejects(venue.validate(), /Path `startsAt` is required/);
});

test("accepts only supported venue types", async () => {
  const basketball = new Venue({
    ...validVenue(),
    venueType: VENUE_TYPES.BASKETBALL,
  });
  await basketball.validate();

  const unsupported = new Venue({
    ...validVenue(),
    venueType: "volleyball",
  });
  await assert.rejects(
    unsupported.validate(),
    /is not a valid enum value for path `venueType`/,
  );
});
