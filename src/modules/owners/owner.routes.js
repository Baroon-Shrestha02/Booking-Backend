import { Router } from "express";
import authenticate from "../../middlewares/authenticate.js";
import requireRole from "../../middlewares/requireRole.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { USER_ROLES } from "../../shared/constants/index.js";
import businessDocumentsUpload from "./businessDocuments.middleware.js";
import {
  getBusinessVerificationController,
  submitBusinessVerificationController,
  updateBusinessVerificationController,
} from "./ownerBusinessVerification.controller.js";
import {
  submitBusinessVerificationSchema,
  updateBusinessVerificationSchema,
} from "./businessVerification.validation.js";

const router = Router();

router.use(authenticate, requireRole(USER_ROLES.OWNER));

router
  .route("/me/business-verification")
  .get(getBusinessVerificationController)
  .post(
    businessDocumentsUpload,
    validateRequest(submitBusinessVerificationSchema),
    submitBusinessVerificationController,
  )
  .patch(
    businessDocumentsUpload,
    validateRequest(updateBusinessVerificationSchema),
    updateBusinessVerificationController,
  );

export default router;
