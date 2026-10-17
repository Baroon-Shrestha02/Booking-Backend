import {
  parseBoolean,
  parseCsv,
  parseInteger,
  requireSecret,
} from "./env-parsers.js";

const nodeEnv = process.env.NODE_ENV || "development";
const allowedEnvironments = new Set(["development", "test", "production"]);
if (!allowedEnvironments.has(nodeEnv)) {
  throw new Error("NODE_ENV must be development, test, or production");
}

const isProduction = nodeEnv === "production";
const developmentAccessSecret = "development-access-secret-change-me";
const developmentRefreshSecret = "development-refresh-secret-change-me";
const developmentOtpSecret = "development-otp-hash-secret-change-me";

const env = Object.freeze({
  nodeEnv,
  isProduction,
  isTest: nodeEnv === "test",
  host: process.env.HOST || "0.0.0.0",
  port: parseInteger("PORT", process.env.PORT, 3000, { min: 1, max: 65535 }),
  mongodbUri: process.env.MONGODB_URI,
  clientOrigins: parseCsv(process.env.CLIENT_ORIGINS, [
    "http://localhost:3000",
  ]),
  trustProxy: parseBoolean(process.env.TRUST_PROXY, false),
  accessTokenSecret: requireSecret(
    "JWT_ACCESS_SECRET",
    process.env.JWT_ACCESS_SECRET,
    {
      production: isProduction,
      fallback: isProduction ? undefined : developmentAccessSecret,
    },
  ),
  refreshTokenSecret: requireSecret(
    "JWT_REFRESH_SECRET",
    process.env.JWT_REFRESH_SECRET,
    {
      production: isProduction,
      fallback: isProduction ? undefined : developmentRefreshSecret,
    },
  ),
  accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  refreshTokenExpiresDays: parseInteger(
    "REFRESH_TOKEN_EXPIRES_DAYS",
    process.env.REFRESH_TOKEN_EXPIRES_DAYS,
    30,
    { min: 1, max: 365 },
  ),
  otpHashSecret: requireSecret("OTP_HASH_SECRET", process.env.OTP_HASH_SECRET, {
    production: isProduction,
    fallback: isProduction ? undefined : developmentOtpSecret,
  }),
  otpExpiresMinutes: parseInteger(
    "OTP_EXPIRES_MINUTES",
    process.env.OTP_EXPIRES_MINUTES,
    5,
    { min: 1, max: 30 },
  ),
  otpResendSeconds: parseInteger(
    "OTP_RESEND_SECONDS",
    process.env.OTP_RESEND_SECONDS,
    60,
    { min: 15, max: 3600 },
  ),
  otpMaxAttempts: parseInteger(
    "OTP_MAX_ATTEMPTS",
    process.env.OTP_MAX_ATTEMPTS,
    5,
    { min: 1, max: 10 },
  ),
  mailFrom: process.env.MAIL_FROM || "KhelYard <no-reply@khelyard.local>",
  smtp: Object.freeze({
    host: process.env.SMTP_HOST || "",
    port: parseInteger("SMTP_PORT", process.env.SMTP_PORT, 587, {
      min: 1,
      max: 65535,
    }),
    secure: parseBoolean(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
  }),
  cloudinary: Object.freeze({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  }),
});

export default env;
