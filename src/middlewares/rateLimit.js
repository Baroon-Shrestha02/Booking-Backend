import { rateLimit } from "express-rate-limit";

const createLimiter = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        status: "failed",
        message,
      });
    },
  });

export const otpRequestLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many verification-code requests. Try again later.",
});

export const otpVerifyLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: "Too many verification attempts. Try again later.",
});

export const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "Too many login attempts. Try again later.",
});
