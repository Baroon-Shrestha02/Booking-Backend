import test from "node:test";
import assert from "node:assert/strict";
import {
  VENUE_AVAILABILITY_STATUSES,
  VENUE_CLOSURE_TYPES,
  VENUE_STATUSES,
} from "../../shared/constants/index.js";
import {
  resolveVenueAvailability,
  splitVenueClosures,
} from "./venue.service.js";

const venue = {
  status: VENUE_STATUSES.ACTIVE,
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
};

test("marks a venue closed on a single scheduled date", () => {
  const result = resolveVenueAvailability(
    venue,
    new Date("2026-10-30T06:00:00.000Z"),
  );
  assert.equal(result.availabilityStatus, VENUE_AVAILABILITY_STATUSES.CLOSED);
  assert.equal(result.closureReason, "Private event");
});

test("marks every inclusive date in a closure range as closed", () => {
  const result = resolveVenueAvailability(
    venue,
    new Date("2026-11-05T06:00:00.000Z"),
  );
  assert.equal(result.availabilityStatus, VENUE_AVAILABILITY_STATUSES.CLOSED);
  assert.equal(result.closureReason, "Tihar holiday");
});

test("automatically marks the venue active outside closure dates", () => {
  const result = resolveVenueAvailability(
    venue,
    new Date("2026-11-06T06:00:00.000Z"),
  );
  assert.equal(result.availabilityStatus, VENUE_AVAILABILITY_STATUSES.ACTIVE);
  assert.equal(result.closureReason, null);
});

test("marks an owner-inactivated venue as closed", () => {
  const result = resolveVenueAvailability(
    { ...venue, status: VENUE_STATUSES.INACTIVE },
    new Date("2026-11-06T06:00:00.000Z"),
  );
  assert.equal(result.availabilityStatus, VENUE_AVAILABILITY_STATUSES.CLOSED);
  assert.equal(result.closureReason, "Venue is closed by the owner.");
});

test("separates completed closures from current and upcoming closures", () => {
  const result = splitVenueClosures(
    venue.closures,
    new Date("2026-11-02T06:00:00.000Z"),
  );

  assert.deepEqual(result.pastClosures, [venue.closures[0]]);
  assert.deepEqual(result.upcomingClosures, [venue.closures[1]]);
});

test("keeps a single-day closure in upcoming closures for the whole Nepal date", () => {
  const result = splitVenueClosures(
    venue.closures,
    new Date("2026-10-30T06:00:00.000Z"),
  );

  assert.equal(result.pastClosures.length, 0);
  assert.equal(result.upcomingClosures.length, 2);
});
