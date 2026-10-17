import { Router } from "express";
import authenticate from "../../middlewares/authenticate.js";
import validateRequest from "../../middlewares/validateRequest.js";
import {
  loginLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
} from "../../middlewares/rateLimit.js";
import {
  loginController,
  logoutController,
  refreshController,
  registerController,
  resendRegistrationOtpController,
  currentUserController,
  verifyRegistrationController,
} from "./auth.controller.js";
import {
  loginSchema,
  refreshSchema,
  registerSchema,
  resendRegistrationOtpSchema,
  verifyRegistrationSchema,
} from "./auth.validation.js";

const router = Router();

router.post(
  "/register",
  otpRequestLimiter,
  validateRequest(registerSchema),
  registerController,
);
router.post(
  "/verify-registration",
  otpVerifyLimiter,
  validateRequest(verifyRegistrationSchema),
  verifyRegistrationController,
);
router.post(
  "/resend-registration-otp",
  otpRequestLimiter,
  validateRequest(resendRegistrationOtpSchema),
  resendRegistrationOtpController,
);
router.post(
  "/login",
  loginLimiter,
  validateRequest(loginSchema),
  loginController,
);
router.post("/refresh", validateRequest(refreshSchema), refreshController);
router.get("/me", authenticate, currentUserController);
router.post("/logout", authenticate, logoutController);

export default router;
