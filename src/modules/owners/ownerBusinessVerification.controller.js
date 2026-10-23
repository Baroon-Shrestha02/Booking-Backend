import asyncHandler from "../../shared/utils/asyncHandler.js";
import {
  getBusinessVerification,
  submitBusinessVerification,
  updateBusinessVerification,
} from "./ownerBusinessVerification.service.js";

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
