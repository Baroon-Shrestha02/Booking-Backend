import AppError from "../../shared/errors/AppError.js";
import {
  AUTH_ERROR_CODES,
  BUSINESS_VERIFICATION_STATUSES,
  VENUE_AVAILABILITY_STATUSES,
  VENUE_CLOSURE_TYPES,
  VENUE_ERROR_CODES,
  VENUE_STATUSES,
} from "../../shared/constants/index.js";
import { findBusinessVerificationByOwner } from "../owners/ownerBusinessVerification.repository.js";
import {
  createVenue,
  findActiveVenueById,
  findActiveVenues,
  findVenueByOwnerAndId,
  findVenuesByOwner,
  saveVenue,
} from "./venue.repository.js";
import { deleteVenueImage, uploadVenueImage } from "./venueImages.js";

const NEPAL_TIMEZONE = "Asia/Kathmandu";

const localDateInNepal = (date) => {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: NEPAL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
};

export const splitVenueClosures = (closures = [], now = new Date()) => {
  const localDate = localDateInNepal(now);
  return closures.reduce(
    (result, closure) => {
      const finalDate =
        closure.type === VENUE_CLOSURE_TYPES.SINGLE_DAY
          ? closure.date
          : closure.endsOn;
      const key = finalDate < localDate ? "pastClosures" : "upcomingClosures";
      result[key].push(closure);
      return result;
    },
    { upcomingClosures: [], pastClosures: [] },
  );
};

export const resolveVenueAvailability = (venue, now = new Date()) => {
  if (venue.status !== VENUE_STATUSES.ACTIVE) {
    const messages = {
      [VENUE_STATUSES.DRAFT]: "Venue is not active yet.",
      [VENUE_STATUSES.INACTIVE]: "Venue is closed by the owner.",
      [VENUE_STATUSES.SUSPENDED]: "Venue is suspended.",
    };
    return {
      availabilityStatus: VENUE_AVAILABILITY_STATUSES.CLOSED,
      closureReason: messages[venue.status] || "Venue is closed.",
    };
  }

  const localDate = localDateInNepal(now);
  const closure = (venue.closures || []).find((entry) => {
    if (entry.type === VENUE_CLOSURE_TYPES.SINGLE_DAY) {
      return entry.date === localDate;
    }
    return entry.startsOn <= localDate && localDate <= entry.endsOn;
  });

  return closure
    ? {
        availabilityStatus: VENUE_AVAILABILITY_STATUSES.CLOSED,
        closureReason: closure.reason || "Venue is closed for this date.",
      }
    : {
        availabilityStatus: VENUE_AVAILABILITY_STATUSES.ACTIVE,
        closureReason: null,
      };
};

const venueData = (venue) => {
  const value = venue.toObject();
  const now = new Date();
  const availability = resolveVenueAvailability(value, now);
  const categorizedClosures = splitVenueClosures(value.closures, now);
  delete value.owner;
  delete value.businessVerification;
  delete value.closures;
  return { ...value, ...categorizedClosures, ...availability };
};

const validationError = (error) => {
  if (error?.name !== "ValidationError") return null;
  return new AppError(
    422,
    AUTH_ERROR_CODES.VALIDATION_FAILED,
    "The venue contains invalid values.",
    {
      issues: Object.entries(error.errors).map(([path, issue]) => ({
        path,
        message: issue.message,
      })),
    },
  );
};

const assertApprovedBusiness = async (ownerId) => {
  const verification = await findBusinessVerificationByOwner(ownerId);
  if (verification?.status !== BUSINESS_VERIFICATION_STATUSES.APPROVED) {
    throw new AppError(
      403,
      VENUE_ERROR_CODES.BUSINESS_NOT_APPROVED,
      "Business verification must be approved before managing venues.",
    );
  }
  return verification;
};

const uploadImages = async ({ files, ownerId }) => {
  const images = [];
  try {
    for (const [index, file] of files.entries()) {
      const uploaded = await uploadVenueImage({ file, ownerId });
      images.push({
        ...uploaded,
        isCover: index === 0,
        sortOrder: index,
      });
    }
    return images;
  } catch (error) {
    await Promise.allSettled(
      images.map((image) => deleteVenueImage(image.publicId)),
    );
    throw error;
  }
};

const deleteImages = (images) =>
  Promise.allSettled(
    (images || []).map((image) => deleteVenueImage(image.publicId)),
  );

export const createOwnerVenue = async ({ ownerId, fields, files = [] }) => {
  const verification = await assertApprovedBusiness(ownerId);
  if (files.length === 0) {
    throw new AppError(
      422,
      AUTH_ERROR_CODES.VALIDATION_FAILED,
      "At least one venue image is required.",
    );
  }

  const images = await uploadImages({ files, ownerId });
  try {
    const venue = await createVenue({
      ...fields,
      owner: ownerId,
      businessVerification: verification._id,
      images,
      status: VENUE_STATUSES.ACTIVE,
    });
    return venueData(venue);
  } catch (error) {
    await deleteImages(images);
    throw validationError(error) || error;
  }
};

export const getOwnerVenues = async (ownerId) => {
  const venues = await findVenuesByOwner(ownerId);
  return venues.map(venueData);
};

export const getOwnerVenue = async ({ ownerId, venueId }) => {
  const venue = await findVenueByOwnerAndId(ownerId, venueId);
  if (!venue) {
    throw new AppError(404, VENUE_ERROR_CODES.NOT_FOUND, "Venue not found.");
  }
  return venueData(venue);
};

export const updateOwnerVenue = async ({
  ownerId,
  venueId,
  fields,
  files = [],
}) => {
  await assertApprovedBusiness(ownerId);
  if (Object.keys(fields).length === 0 && files.length === 0) {
    throw new AppError(
      422,
      AUTH_ERROR_CODES.VALIDATION_FAILED,
      "Provide at least one venue field or venue image.",
    );
  }

  const venue = await findVenueByOwnerAndId(ownerId, venueId);
  if (!venue) {
    throw new AppError(404, VENUE_ERROR_CODES.NOT_FOUND, "Venue not found.");
  }

  const oldImages = venue.images.map((image) => image.toObject());
  const images =
    files.length > 0 ? await uploadImages({ files, ownerId }) : null;
  venue.set({ ...fields, ...(images ? { images } : {}) });

  try {
    const updated = await saveVenue(venue);
    if (images) await deleteImages(oldImages);
    return venueData(updated);
  } catch (error) {
    if (images) await deleteImages(images);
    throw validationError(error) || error;
  }
};

export const getAvailableVenues = async () => {
  const venues = await findActiveVenues();
  return venues.map(venueData);
};

export const getAvailableVenue = async (venueId) => {
  const venue = await findActiveVenueById(venueId);
  if (!venue) {
    throw new AppError(404, VENUE_ERROR_CODES.NOT_FOUND, "Venue not found.");
  }
  return venueData(venue);
};
