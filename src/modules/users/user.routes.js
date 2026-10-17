import { Router } from "express";
import authenticate from "../../middlewares/authenticate.js";
import validateRequest from "../../middlewares/validateRequest.js";
import profileImageUpload from "./profileImage.middleware.js";
import {
  getProfileController,
  updateProfileController,
} from "./user.controller.js";
import { updateProfileSchema } from "./user.validation.js";

const router = Router();

router.get("/me", authenticate, getProfileController);
router.patch(
  "/me",
  authenticate,
  profileImageUpload,
  validateRequest(updateProfileSchema),
  updateProfileController,
);

export default router;
