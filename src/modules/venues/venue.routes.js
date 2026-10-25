import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest.js";
import {
  getAvailableVenueController,
  getAvailableVenuesController,
} from "./venue.controller.js";
import { venueIdSchema } from "./venue.validation.js";

const router = Router();

router.get("/", getAvailableVenuesController);
router.get(
  "/:venueId",
  validateRequest(venueIdSchema),
  getAvailableVenueController,
);

export default router;
