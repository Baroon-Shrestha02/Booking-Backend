import asyncHandler from "../../shared/utils/asyncHandler.js";
import {
  createOwnerVenue,
  getAvailableVenue,
  getAvailableVenues,
  getOwnerVenue,
  getOwnerVenues,
  updateOwnerVenue,
} from "./venue.service.js";

export const createVenueController = asyncHandler(async (req, res) => {
  const data = await createOwnerVenue({
    ownerId: req.auth.userId,
    fields: req.body,
    files: req.files,
  });
  res.status(201).json({
    status: "success",
    message: "Venue created successfully.",
    data,
  });
});

export const getOwnerVenuesController = asyncHandler(async (req, res) => {
  const data = await getOwnerVenues(req.auth.userId);
  res.status(200).json({
    status: "success",
    message: "Venues retrieved successfully.",
    data,
  });
});

export const getOwnerVenueController = asyncHandler(async (req, res) => {
  const data = await getOwnerVenue({
    ownerId: req.auth.userId,
    venueId: req.params.venueId,
  });
  res.status(200).json({
    status: "success",
    message: "Venue retrieved successfully.",
    data,
  });
});

export const updateVenueController = asyncHandler(async (req, res) => {
  const data = await updateOwnerVenue({
    ownerId: req.auth.userId,
    venueId: req.params.venueId,
    fields: req.body,
    files: req.files,
  });
  res.status(200).json({
    status: "success",
    message: "Venue updated successfully.",
    data,
  });
});

export const getAvailableVenuesController = asyncHandler(async (_req, res) => {
  const data = await getAvailableVenues();
  res.status(200).json({
    status: "success",
    message: "Available venues retrieved successfully.",
    data,
  });
});

export const getAvailableVenueController = asyncHandler(async (req, res) => {
  const data = await getAvailableVenue(req.params.venueId);
  res.status(200).json({
    status: "success",
    message: "Venue retrieved successfully.",
    data,
  });
});
