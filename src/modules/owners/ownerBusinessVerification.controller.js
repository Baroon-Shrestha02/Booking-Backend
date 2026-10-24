import asyncHandler from "../../shared/utils/asyncHandler.js";
import {
  getAllBusinessVerificationsForAdmin,
  getBusinessVerification,
  reviewBusinessVerification,
  submitBusinessVerification,
  updateBusinessVerification,
} from "./ownerBusinessVerification.service.js";

export const getAllBusinessVerificationsController = asyncHandler(
  async (_req, res) => {
    const data = await getAllBusinessVerificationsForAdmin();
    res.status(200).json({
      status: "success",
      message: "Business-verification submissions retrieved successfully.",
      data,
    });
  },
);

export const reviewBusinessVerificationController = asyncHandler(
  async (req, res) => {
    const data = await reviewBusinessVerification({
      verificationId: req.params.verificationId,
      adminId: req.auth.userId,
      ...req.body,
    });
    res.status(200).json({
      status: "success",
      message: `Business verification ${req.body.status} successfully.`,
      data,
    });
  },
);

export const submitBusinessVerificationController = asyncHandler(
  async (req, res) => {
    const data = await submitBusinessVerification({
      ownerId: req.auth.userId,
      fields: req.body,
      files: req.files,
    });
    res.status(201).json({
      status: "success",
      message: "Business verification submitted successfully.",
      data,
    });
  },
);

export const updateBusinessVerificationController = asyncHandler(
  async (req, res) => {
    const data = await updateBusinessVerification({
      ownerId: req.auth.userId,
      fields: req.body,
      files: req.files,
    });
    res.status(200).json({
      status: "success",
      message: "Business verification updated successfully.",
      data,
    });
  },
);

export const getBusinessVerificationController = asyncHandler(
  async (req, res) => {
    const data = await getBusinessVerification(req.auth.userId);
    res.status(200).json({
      status: "success",
      message: "Business verification retrieved successfully.",
      data,
    });
  },
);
