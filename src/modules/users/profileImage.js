import cloudinary, { isCloudinaryConfigured } from "../../config/cloudinary.js";
import AppError from "../../shared/errors/AppError.js";
import { AUTH_ERROR_CODES } from "../../shared/constants/index.js";

export const uploadProfileImage = ({ buffer, userId }) => {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      503,
      AUTH_ERROR_CODES.INTERNAL_ERROR,
      "Profile image uploads are not configured.",
    );
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "khelyard/profile-images",
        public_id: `${userId}-${Date.now()}`,
        resource_type: "image",
        transformation: [
          { width: 800, height: 800, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(
            new AppError(
              503,
              AUTH_ERROR_CODES.INTERNAL_ERROR,
              "Profile image upload failed.",
            ),
          );
          return;
        }
        resolve({
          publicId: result.public_id,
          publicUrl: result.secure_url,
        });
      },
    );
    stream.end(buffer);
  });
};

export const deleteProfileImage = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};
