import multer from "multer";
import AppError from "../../shared/errors/AppError.js";
import { AUTH_ERROR_CODES } from "../../shared/constants/index.js";

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/HEIC",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/jpg",
]);

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: 5 * 1024 * 1024, fields: 10 },
  fileFilter: (_req, file, callback) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      callback(
        new AppError(
          422,
          AUTH_ERROR_CODES.VALIDATION_FAILED,
          "Profile image must be a JPEG, PNG, or WebP file.",
        ),
      );
      return;
    }
    callback(null, true);
  },
}).single("profileImage");

const profileImageUpload = (req, res, next) => {
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
        ? "Profile image must not exceed 5 MB."
        : "The profile image could not be processed.";
    next(new AppError(422, AUTH_ERROR_CODES.VALIDATION_FAILED, message));
  });
};

export default profileImageUpload;
