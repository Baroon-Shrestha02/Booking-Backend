import { Router } from "express";
import authenticate from "../../middlewares/authenticate.js";
import requireRole from "../../middlewares/requireRole.js";
import validateRequest from "../../middlewares/validateRequest.js";
import {
  loginLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
} from "../../middlewares/rateLimit.js";
import { USER_ROLES } from "../../shared/constants/index.js";
import {
  changeAdminPasswordController,
  currentAdminController,
  forgotAdminPasswordController,
  loginAdminController,
  logoutController,
  refreshAdminController,
  resetAdminPasswordController,
} from "./auth.controller.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
} from "./auth.validation.js";

const router = Router();
const requireAdmin = requireRole(USER_ROLES.ADMIN);

router.post(
  "/login",
  loginLimiter,
  validateRequest(loginSchema),
  loginAdminController,
);
router.post(
  "/forgot-password",
  otpRequestLimiter,
  validateRequest(forgotPasswordSchema),
  forgotAdminPasswordController,
);
router.post(
  "/reset-password",
  otpVerifyLimiter,
  validateRequest(resetPasswordSchema),
  resetAdminPasswordController,
);
router.post("/refresh", validateRequest(refreshSchema), refreshAdminController);
router.get("/me", authenticate, requireAdmin, currentAdminController);
router.patch(
  "/change-password",
  authenticate,
  requireAdmin,
  validateRequest(changePasswordSchema),
  changeAdminPasswordController,
);
router.post("/logout", authenticate, requireAdmin, logoutController);

export default router;
