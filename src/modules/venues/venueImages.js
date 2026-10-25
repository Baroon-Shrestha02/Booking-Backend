import { randomUUID } from "node:crypto";
import cloudinary, { isCloudinaryConfigured } from "../../config/cloudinary.js";
import AppError from "../../shared/errors/AppError.js";
import { VENUE_ERROR_CODES } from "../../shared/constants/index.js";

export const uploadVenueImage = ({ file, ownerId }) => {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      503,
      VENUE_ERROR_CODES.IMAGE_UPLOAD_UNAVAILABLE,
      "Venue image uploads are not configured.",
    );
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `khelyard/venues/${ownerId}`,
        public_id: `${Date.now()}-${randomUUID()}`,
        resource_type: "image",
        transformation: [
          { width: 1600, height: 1200, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(
            new AppError(
              503,
              VENUE_ERROR_CODES.IMAGE_UPLOAD_UNAVAILABLE,
              "Venue image upload failed.",
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
    stream.end(file.buffer);
  });
};

export const deleteVenueImage = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};
