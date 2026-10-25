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
  limits: { files: 3, fileSize: 5 * 1024 * 1024, fields: 5 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      callback(
        new AppError(
          422,
          AUTH_ERROR_CODES.VALIDATION_FAILED,
          "Business documents must be JPEG, PNG, or WebP images.",
        ),
      );
      return;
    }
    callback(null, true);
  },
}).fields([
  { name: "panVatImage", maxCount: 1 },
  { name: "taxClearanceImage", maxCount: 1 },
  { name: "businessLogo", maxCount: 1 },
]);

const businessDocumentsUpload = (req, res, next) => {
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
        ? "Each business document must not exceed 5 MB."
        : "The business documents could not be processed.";
    next(new AppError(422, AUTH_ERROR_CODES.VALIDATION_FAILED, message));
  });
};

export default businessDocumentsUpload;
