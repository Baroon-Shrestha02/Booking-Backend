import Venue from "./venue.model.js";
import { VENUE_STATUSES } from "../../shared/constants/index.js";

export const createVenue = (data) => Venue.create(data);

export const findVenuesByOwner = (ownerId) =>
  Venue.find({ owner: ownerId }).sort({ createdAt: -1 });

export const findVenueByOwnerAndId = (ownerId, venueId) =>
  Venue.findOne({ owner: ownerId, venueId });

export const saveVenue = (venue) => venue.save();

export const findActiveVenues = () =>
  Venue.find({ status: VENUE_STATUSES.ACTIVE }).sort({ createdAt: -1 });

export const findActiveVenueById = (venueId) =>
  Venue.findOne({ venueId, status: VENUE_STATUSES.ACTIVE });
