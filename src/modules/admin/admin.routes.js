import { Router } from "express";
import authenticate from "../../middlewares/authenticate.js";
import requireRole from "../../middlewares/requireRole.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { USER_ROLES } from "../../shared/constants/index.js";
import { reviewBusinessVerificationSchema } from "../owners/businessVerification.validation.js";
import {
  getAllBusinessVerificationsController,
  reviewBusinessVerificationController,
} from "../owners/ownerBusinessVerification.controller.js";

const router = Router();

router.use(authenticate, requireRole(USER_ROLES.ADMIN));

router.get("/business-verifications", getAllBusinessVerificationsController);
router.patch(
  "/business-verifications/:verificationId",
  validateRequest(reviewBusinessVerificationSchema),
  reviewBusinessVerificationController,
);

export default router;
