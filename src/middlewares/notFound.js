import AppError from "../shared/errors/AppError.js";
import { AUTH_ERROR_CODES } from "../shared/constants/index.js";

const notFound = (req, _res, next) => {
  next(
    new AppError(
      404,
      AUTH_ERROR_CODES.NOT_FOUND,
      `No route matches ${req.method} ${req.originalUrl}.`,
    ),
  );
};

export default notFound;
