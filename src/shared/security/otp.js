import { createHmac, randomInt } from "node:crypto";
import env from "../../config/env.js";
import { safeEqual } from "./hash.js";

export const generateOtp = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

export const hashOtp = ({ subject, purpose, code }) =>
  createHmac("sha256", env.otpHashSecret)
    .update(`${subject}:${purpose}:${code}`)
    .digest("hex");

export const verifyOtpHash = ({ subject, purpose, code, expectedHash }) =>
  safeEqual(hashOtp({ subject, purpose, code }), expectedHash);
