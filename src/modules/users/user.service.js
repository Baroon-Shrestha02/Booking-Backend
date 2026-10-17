import AppError from "../../shared/errors/AppError.js";
import { AUTH_ERROR_CODES } from "../../shared/constants/index.js";
import { findUserById, updateUserProfile } from "./user.repository.js";
import { deleteProfileImage, uploadProfileImage } from "./profileImage.js";

const profileData = (user) => ({
  _id: String(user._id),
  name: user.name,
  email: user.email,
  phone: user.phone,
  profileImage: user.profileImage,
  homeArea: user.homeArea,
  bio: user.bio,
  favouriteSports: user.favouriteSports,
  stats: user.stats,
  creditsBalance: user.creditsBalance,
  role: user.role,
  status: user.status,
  isVerified: user.isVerified,
  verifiedAt: user.verifiedAt,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getUserProfile = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError(404, AUTH_ERROR_CODES.NOT_FOUND, "User not found.");
  }
  return profileData(user);
};

export const updateProfile = async ({ userId, fields, image }) => {
  if (Object.keys(fields).length === 0 && !image) {
    throw new AppError(
      422,
      AUTH_ERROR_CODES.VALIDATION_FAILED,
      "Provide at least one profile field or profile image.",
    );
  }

  const existingUser = await findUserById(userId);
  if (!existingUser) {
    throw new AppError(404, AUTH_ERROR_CODES.NOT_FOUND, "User not found.");
  }

  let uploadedImage = null;
  if (image) {
    uploadedImage = await uploadProfileImage({
      buffer: image.buffer,
      userId,
    });
  }

  const updates = {
    ...fields,
    ...(uploadedImage ? { profileImage: uploadedImage } : {}),
  };

  let updatedUser;
  try {
    updatedUser = await updateUserProfile(userId, updates);
  } catch (error) {
    if (uploadedImage) {
      await deleteProfileImage(uploadedImage.publicId).catch(() => {});
    }
    throw error;
  }

  if (uploadedImage && existingUser.profileImage?.publicId) {
    await deleteProfileImage(existingUser.profileImage.publicId).catch(() => {});
  }

  return profileData(updatedUser);
};
