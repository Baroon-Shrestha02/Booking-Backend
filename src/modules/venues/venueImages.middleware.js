import multer from "multer";
import AppError from "../../shared/errors/AppError.js";
import { AUTH_ERROR_CODES } from "../../shared/constants/index.js";

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "image/heic",
  "image/heif",
]);

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { files: 12, fileSize: 5 * 1024 * 1024, fields: 30 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      callback(
        new AppError(
          422,
          AUTH_ERROR_CODES.VALIDATION_FAILED,
          "Venue images must be JPEG, PNG, or WebP files.",
        ),
      );
      return;
    }
    callback(null, true);
  },
}).array("images", 12);

const venueImagesUpload = (req, res, next) => {
  uploader(req, res, (error) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof AppError) {
      next(error);
      return;
    }

    const message =
      error?.code === "LIMIT_FILE_SIZE"
        ? "Each venue image must not exceed 5 MB."
        : error?.code === "LIMIT_FILE_COUNT"
          ? "A venue can contain at most 12 images."
          : "The venue images could not be processed.";
    next(new AppError(422, AUTH_ERROR_CODES.VALIDATION_FAILED, message));
  });
};

export default venueImagesUpload;
