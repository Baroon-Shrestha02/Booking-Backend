import { VENUE_CLOSURE_TYPES } from "../../shared/constants/index.js";

export const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
export const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const timeToMinutes = (value) => {
  if (!timePattern.test(value || "")) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const isCalendarDate = (value) => {
  if (!datePattern.test(value || "")) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
};

const validateOperatingSchedule = (venue) => {
  const defaultHours = venue.operatingSchedule?.defaultHours;
  const defaultOpen = timeToMinutes(defaultHours?.opensAt);
  const defaultClose = timeToMinutes(defaultHours?.closesAt);
  if (
    defaultOpen !== null &&
    defaultClose !== null &&
    defaultOpen >= defaultClose
  ) {
    venue.invalidate(
      "operatingSchedule.defaultHours.closesAt",
      "Closing time must be later than opening time",
    );
  }

  const overrideDays = new Set();
  for (const [index, override] of (
    venue.operatingSchedule?.dayOverrides || []
  ).entries()) {
    const path = `operatingSchedule.dayOverrides.${index}`;
    if (overrideDays.has(override.dayOfWeek)) {
      venue.invalidate(`${path}.dayOfWeek`, "A day can only have one override");
    }
    overrideDays.add(override.dayOfWeek);

    if (override.isClosed && (override.opensAt || override.closesAt)) {
      venue.invalidate(
        path,
        "A closed-day override cannot contain opening or closing times",
      );
    } else if (
      !override.isClosed &&
      (!override.opensAt || !override.closesAt)
    ) {
      venue.invalidate(path, "An open-day override requires both times");
    } else if (
      !override.isClosed &&
      timeToMinutes(override.opensAt) >= timeToMinutes(override.closesAt)
    ) {
      venue.invalidate(`${path}.closesAt`, "Closing time must be later");
    }
  }
};

const closureRange = (venue, closure, index) => {
  const path = `closures.${index}`;
  if (closure.type === VENUE_CLOSURE_TYPES.SINGLE_DAY) {
    if (!isCalendarDate(closure.date) || closure.startsOn || closure.endsOn) {
      venue.invalidate(path, "A single-day closure requires only a valid date");
      return null;
    }
    return { index, startsOn: closure.date, endsOn: closure.date };
  }

  if (closure.type === VENUE_CLOSURE_TYPES.DATE_RANGE) {
    if (
      closure.date ||
      !isCalendarDate(closure.startsOn) ||
      !isCalendarDate(closure.endsOn) ||
      closure.startsOn > closure.endsOn
    ) {
      venue.invalidate(
        path,
        "A date-range closure requires a valid start and end date",
      );
      return null;
    }
    return { index, startsOn: closure.startsOn, endsOn: closure.endsOn };
  }

  return null;
};

const validateClosures = (venue) => {
  const ranges = (venue.closures || [])
    .map((closure, index) => closureRange(venue, closure, index))
    .filter(Boolean)
    .sort((left, right) => left.startsOn.localeCompare(right.startsOn));

  for (let index = 1; index < ranges.length; index += 1) {
    if (ranges[index].startsOn <= ranges[index - 1].endsOn) {
      venue.invalidate(
        `closures.${ranges[index].index}`,
        "Venue closures cannot overlap",
      );
    }
  }
};

const validatePricing = (venue) => {
  const periods = [...(venue.pricing?.periods || [])].sort(
    (left, right) =>
      (timeToMinutes(left.startsAt) ?? Number.MAX_SAFE_INTEGER) -
      (timeToMinutes(right.startsAt) ?? Number.MAX_SAFE_INTEGER),
  );
  const names = new Set();

  for (const [index, period] of periods.entries()) {
    if (names.has(period.name)) {
      venue.invalidate(
        "pricing.periods",
        "Pricing-period names must be unique",
      );
    }
    names.add(period.name);

    const startsAt = timeToMinutes(period.startsAt);
    const endsAt = timeToMinutes(period.endsAt);
    if (startsAt !== null && endsAt !== null && startsAt >= endsAt) {
      venue.invalidate(
        "pricing.periods",
        "Pricing-period end times must be later than start times",
      );
    }

    const previousEnd =
      index > 0 ? timeToMinutes(periods[index - 1].endsAt) : null;
    if (startsAt !== null && previousEnd !== null && startsAt < previousEnd) {
      venue.invalidate("pricing.periods", "Pricing periods cannot overlap");
    }
  }

  const weekendDays = venue.pricing?.weekendDays || [];
  if (new Set(weekendDays).size !== weekendDays.length) {
    venue.invalidate("pricing.weekendDays", "Weekend days must be unique");
  }
};

const validateUniqueLists = (venue) => {
  const imageIds = (venue.images || []).map((image) => image.publicId);
  if (new Set(imageIds).size !== imageIds.length) {
    venue.invalidate("images", "Venue image public IDs must be unique");
  }
  if ((venue.images || []).filter((image) => image.isCover).length !== 1) {
    venue.invalidate("images", "Exactly one venue image must be the cover");
  }

  const amenities = venue.amenities || [];
  if (new Set(amenities).size !== amenities.length) {
    venue.invalidate("amenities", "Venue amenities must be unique");
  }
};

export const attachVenueModelValidation = (schema) => {
  schema.pre("validate", function validateVenueRules() {
    validateOperatingSchedule(this);
    validateClosures(this);
    validatePricing(this);
    validateUniqueLists(this);
  });
};
