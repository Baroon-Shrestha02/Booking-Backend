import asyncHandler from "../../shared/utils/asyncHandler.js";
import {
  changePassword,
  getCurrentUser,
  loginAdmin,
  loginUser,
  logout,
  refreshTokens,
  registerOwner,
  registerUser,
  requestPasswordReset,
  resetPassword,
  resendRegistrationOtp,
  verifyRegistration,
} from "./auth.service.js";
import { USER_ROLES } from "../../shared/constants/index.js";

const requestContext = (req) => ({
  ip: req.ip,
  userAgent: req.get("user-agent") || null,
});

export const registerController = asyncHandler(async (req, res) => {
  const result = await registerUser({
    ...req.body,
    requestedIp: req.ip,
  });
  res.status(201).json({
    status: "success",
    message: "Registration successful. Verification code sent to email.",
    data: result,
  });
});

export const registerOwnerController = asyncHandler(async (req, res) => {
  const result = await registerOwner({
    ...req.body,
    requestedIp: req.ip,
  });
  res.status(201).json({
    status: "success",
    message: "Owner registration successful. Verification code sent to email.",
    data: result,
  });
});

export const verifyOwnerRegistrationController = asyncHandler(
  async (req, res) => {
    const result = await verifyRegistration({
      ...req.body,
      ...requestContext(req),
      expectedRole: USER_ROLES.OWNER,
    });
    res.status(200).json({
      status: "success",
      message: "Owner email verified successfully.",
      data: result,
    });
  },
);

export const resendOwnerRegistrationOtpController = asyncHandler(
  async (req, res) => {
    const result = await resendRegistrationOtp({
      ...req.body,
      requestedIp: req.ip,
      expectedRole: USER_ROLES.OWNER,
    });
    res.status(200).json({
      status: "success",
      message: "Verification code sent successfully.",
      data: result,
    });
  },
);

export const verifyRegistrationController = asyncHandler(async (req, res) => {
  const result = await verifyRegistration({
    ...req.body,
    ...requestContext(req),
  });
  res.status(200).json({
    status: "success",
    message: "Email verified successfully.",
    data: result,
  });
});

export const resendRegistrationOtpController = asyncHandler(
  async (req, res) => {
    const result = await resendRegistrationOtp({
      ...req.body,
      requestedIp: req.ip,
    });
    res.status(200).json({
      status: "success",
      message: "Verification code sent successfully.",
      data: result,
    });
  },
);

export const loginController = asyncHandler(async (req, res) => {
  const result = await loginUser({
    ...req.body,
    ...requestContext(req),
  });
  res.status(200).json({
    status: "success",
    message: "Login successful.",
    data: result,
  });
});

export const loginAdminController = asyncHandler(async (req, res) => {
  const result = await loginAdmin({
    ...req.body,
    ...requestContext(req),
  });
  res.status(200).json({
    status: "success",
    message: "Admin login successful.",
    data: result,
  });
});

export const refreshController = asyncHandler(async (req, res) => {
  const result = await refreshTokens(req.body);
  res.status(200).json({
    status: "success",
    message: "Tokens refreshed successfully.",
    data: result,
  });
});

export const refreshAdminController = asyncHandler(async (req, res) => {
  const result = await refreshTokens({
    ...req.body,
    allowedRoles: [USER_ROLES.ADMIN],
  });
  res.status(200).json({
    status: "success",
    message: "Tokens refreshed successfully.",
    data: result,
  });
});

export const currentUserController = asyncHandler(async (req, res) => {
  const data = await getCurrentUser(req.auth.userId);
  if (!data) {
    res.status(204).send();
    return;
  }
  res.status(200).json({
    status: "success",
    message: "Current user retrieved successfully.",
    data,
  });
});

export const currentAdminController = asyncHandler(async (req, res) => {
  const data = await getCurrentUser(req.auth.userId, [USER_ROLES.ADMIN]);
  if (!data) {
    res.status(204).send();
    return;
  }
  res.status(200).json({
    status: "success",
    message: "Current admin retrieved successfully.",
    data,
  });
});

export const forgotPasswordController = asyncHandler(async (req, res) => {
  const result = await requestPasswordReset({
    ...req.body,
    requestedIp: req.ip,
  });
  res.status(200).json({
    status: "success",
    message: result.message,
  });
});

export const forgotAdminPasswordController = asyncHandler(async (req, res) => {
  const result = await requestPasswordReset({
    ...req.body,
    requestedIp: req.ip,
    allowedRoles: [USER_ROLES.ADMIN],
  });
  res.status(200).json({
    status: "success",
    message: result.message,
  });
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  await resetPassword(req.body);
  res.status(200).json({
    status: "success",
    message: "Password reset successfully. Please log in again.",
  });
});

export const resetAdminPasswordController = asyncHandler(async (req, res) => {
  await resetPassword({
    ...req.body,
    allowedRoles: [USER_ROLES.ADMIN],
  });
  res.status(200).json({
    status: "success",
    message: "Password reset successfully. Please log in again.",
  });
});

export const changePasswordController = asyncHandler(async (req, res) => {
  const data = await changePassword({
    userId: req.auth.userId,
    ...req.body,
    ...requestContext(req),
  });
  res.status(200).json({
    status: "success",
    message: "Password changed successfully.",
    data,
  });
});

export const changeAdminPasswordController = asyncHandler(async (req, res) => {
  const data = await changePassword({
    userId: req.auth.userId,
    ...req.body,
    ...requestContext(req),
    allowedRoles: [USER_ROLES.ADMIN],
  });
  res.status(200).json({
    status: "success",
    message: "Password changed successfully.",
    data,
  });
});

export const logoutController = asyncHandler(async (req, res) => {
  await logout(req.auth.sessionId);
  res.status(200).json({
    status: "success",
    message: "Logged out successfully.",
  });
});
