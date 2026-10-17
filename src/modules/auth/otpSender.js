import env from "../../config/env.js";
import mailTransporter, { isMailConfigured } from "../../config/mail.js";
import AppError from "../../shared/errors/AppError.js";
import { AUTH_ERROR_CODES } from "../../shared/constants/index.js";

const otpSender = {
  async sendRegistrationCode({ email, name, code }) {
    if (!isMailConfigured()) {
      throw new AppError(
        503,
        AUTH_ERROR_CODES.OTP_DELIVERY_UNAVAILABLE,
        "Email verification is not configured.",
      );
    }

    await mailTransporter.sendMail({
      from: env.mailFrom,
      to: email,
      subject: "Verify your KhelYard account",
      text: `Hello ${name}, your KhelYard verification code is ${code}. It expires in ${env.otpExpiresMinutes} minutes.`,
    });
  },

  async sendPasswordResetCode({ email, name, code }) {
    if (!isMailConfigured()) {
      throw new AppError(
        503,
        AUTH_ERROR_CODES.OTP_DELIVERY_UNAVAILABLE,
        "Password reset email is not configured.",
      );
    }

    await mailTransporter.sendMail({
      from: env.mailFrom,
      to: email,
      subject: "Reset your KhelYard password",
      text: `Hello ${name}, your KhelYard password reset code is ${code}. It expires in ${env.otpExpiresMinutes} minutes. If you did not request this, you can ignore this email.`,
    });
  },
};

export default otpSender;
