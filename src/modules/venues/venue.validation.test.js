import test from "node:test";
import assert from "node:assert/strict";
import { createVenueSchema, updateVenueSchema } from "./venue.validation.js";

const validBody = {
  name: "KhelYard Futsal Arena",
  description: "Indoor venue in New Baneshwor.",
  venueType: "futsal",
  groundCount: 3,
  slotDurationMinutes: 60,
  location: {
    address: "New Baneshwor",
    coordinates: { type: "Point", coordinates: [85.3432, 27.6915] },
  },
  pricing: {
    currency: "NPR",
    weekendDays: [6],
    periods: [
      {
        name: "day",
        startsAt: "08:00",
        endsAt: "21:00",
        weekdayPrice: 1500,
        weekendPrice: 1800,
      },
    ],
  },
};

test("venue creation accepts JSON fields", () => {
  assert.equal(createVenueSchema.body.safeParse(validBody).success, true);
});

test("venue creation does not accept a client-controlled status", () => {
  assert.equal(
    createVenueSchema.body.safeParse({ ...validBody, status: "inactive" })
      .success,
    false,
  );
});

test("venue location only accepts an address and map coordinates", () => {
  assert.equal(
    createVenueSchema.body.safeParse({
      ...validBody,
      location: { ...validBody.location, city: "Kathmandu" },
    }).success,
    false,
  );
  assert.equal(
    createVenueSchema.body.safeParse({
      ...validBody,
      timezone: "Asia/Kathmandu",
    }).success,
    false,
  );
});

test("venue creation parses nested multipart JSON fields", () => {
  const multipart = {
    ...validBody,
    groundCount: "3",
    slotDurationMinutes: "60",
    location: JSON.stringify(validBody.location),
    pricing: JSON.stringify(validBody.pricing),
    amenities: JSON.stringify(["parking", "changing-room"]),
  };
  assert.equal(createVenueSchema.body.safeParse(multipart).success, true);
});

test("venue updates accept a supported subset", () => {
  assert.equal(
    updateVenueSchema.body.safeParse({ status: "inactive" }).success,
    true,
  );
  assert.equal(
    updateVenueSchema.body.safeParse({ status: "suspended" }).success,
    false,
  );
});
