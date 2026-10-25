import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest.js";
import venueImagesUpload from "./venueImages.middleware.js";
import {
  createVenueController,
  getOwnerVenueController,
  getOwnerVenuesController,
  updateVenueController,
} from "./venue.controller.js";
import {
  createVenueSchema,
  updateVenueSchema,
  venueIdSchema,
} from "./venue.validation.js";

const router = Router();

router
  .route("/")
  .get(getOwnerVenuesController)
  .post(
    venueImagesUpload,
    validateRequest(createVenueSchema),
    createVenueController,
  );

router
  .route("/:venueId")
  .get(validateRequest(venueIdSchema), getOwnerVenueController)
  .patch(
    venueImagesUpload,
    validateRequest(updateVenueSchema),
    updateVenueController,
  );

export default router;
