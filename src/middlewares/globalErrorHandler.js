import AppError from "../shared/errors/AppError.js";
import { AUTH_ERROR_CODES } from "../shared/constants/index.js";

const globalErrorHandler = (error, _req, res, _next) => {
  if (error?.code === 11000) {
    error = new AppError(
      409,
      "account_exists",
      "An account already exists with that phone number or email address.",
    );
  }

  const known = error instanceof AppError;
  const status = known ? error.status : 500;
  const code = known ? error.code : AUTH_ERROR_CODES.INTERNAL_ERROR;
  const message = known ? error.message : "An unexpected error occurred.";

  const validationMessage =
    code === AUTH_ERROR_CODES.VALIDATION_FAILED &&
    Array.isArray(error.details?.issues)
      ? error.details.issues[0]?.message
      : null;
  const body = {
    status: "failed",
    message: validationMessage || message,
  };

  res.status(status).json(body);
};

export default globalErrorHandler;
