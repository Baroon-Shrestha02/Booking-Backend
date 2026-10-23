import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest.js";
import {
  otpRequestLimiter,
  otpVerifyLimiter,
} from "../../middlewares/rateLimit.js";
import {
  registerOwnerController,
  resendOwnerRegistrationOtpController,
  verifyOwnerRegistrationController,
} from "./auth.controller.js";
import {
  registerSchema,
  resendRegistrationOtpSchema,
  verifyRegistrationSchema,
} from "./auth.validation.js";

const router = Router();

router.post(
  "/register",
  otpRequestLimiter,
  validateRequest(registerSchema),
  registerOwnerController,
);
router.post(
  "/verify-registration",
  otpVerifyLimiter,
  validateRequest(verifyRegistrationSchema),
  verifyOwnerRegistrationController,
);
router.post(
  "/resend-registration-otp",
  otpRequestLimiter,
  validateRequest(resendRegistrationOtpSchema),
  resendOwnerRegistrationOtpController,
);

export default router;
