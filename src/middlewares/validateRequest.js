import { ZodError } from "zod";
import AppError from "../shared/errors/AppError.js";
import { AUTH_ERROR_CODES } from "../shared/constants/index.js";

const validateRequest = (schemas) => (req, _res, next) => {
  try {
    for (const key of ["params", "query", "body"]) {
      if (schemas[key]) req[key] = schemas[key].parse(req[key]);
    }
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      next(
        new AppError(
          422,
          AUTH_ERROR_CODES.VALIDATION_FAILED,
          "The request contains invalid values.",
          {
            issues: error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          },
        ),
      );
      return;
    }
    next(error);
  }
};

export default validateRequest;
