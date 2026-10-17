import asyncHandler from "../../shared/utils/asyncHandler.js";
import { getUserProfile, updateProfile } from "./user.service.js";

export const getProfileController = asyncHandler(async (req, res) => {
  const data = await getUserProfile(req.auth.userId);
  res.status(200).json({
    status: "success",
    message: "Profile retrieved successfully.",
    data,
  });
});

export const updateProfileController = asyncHandler(async (req, res) => {
  const data = await updateProfile({
    userId: req.auth.userId,
    fields: req.body,
    image: req.file,
  });
  res.status(200).json({
    status: "success",
    message: "Profile updated successfully.",
    data,
  });
});
