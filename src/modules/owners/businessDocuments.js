import cloudinary, { isCloudinaryConfigured } from "../../config/cloudinary.js";
import AppError from "../../shared/errors/AppError.js";
import { OWNER_ERROR_CODES } from "../../shared/constants/index.js";

export const uploadBusinessDocument = ({ file, ownerId, documentType }) => {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      503,
      OWNER_ERROR_CODES.DOCUMENT_UPLOAD_UNAVAILABLE,
      "Business document uploads are not configured.",
    );
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `khelyard/private/owner-verification/${ownerId}`,
        public_id: `${documentType}-${Date.now()}`,
        resource_type: "image",
        type: "authenticated",
      },
      (error, result) => {
        if (error || !result) {
          reject(
            new AppError(
              503,
              OWNER_ERROR_CODES.DOCUMENT_UPLOAD_UNAVAILABLE,
              "Business document upload failed.",
            ),
          );
          return;
        }
        resolve({
          publicId: result.public_id,
          originalName: file.originalname,
          mimeType: file.mimetype,
          bytes: result.bytes,
        });
      },
    );
    stream.end(file.buffer);
  });
};

export const deleteBusinessDocument = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return;
  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    type: "authenticated",
  });
};

export const uploadBusinessLogo = ({ file, ownerId }) => {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      503,
      OWNER_ERROR_CODES.DOCUMENT_UPLOAD_UNAVAILABLE,
      "Business logo uploads are not configured.",
    );
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "khelyard/business-logos",
        public_id: `${ownerId}-${Date.now()}`,
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
              OWNER_ERROR_CODES.DOCUMENT_UPLOAD_UNAVAILABLE,
              "Business logo upload failed.",
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

export const deleteBusinessLogo = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};
