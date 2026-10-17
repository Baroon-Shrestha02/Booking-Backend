import AppError from "../shared/errors/AppError.js";
import { AUTH_ERROR_CODES } from "../shared/constants/index.js";

const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      next(
        new AppError(
          403,
          AUTH_ERROR_CODES.FORBIDDEN,
          "You do not have permission to perform this action.",
        ),
      );
      return;
    }
    next();
  };

export default requireRole;
