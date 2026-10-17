import mongoose from "mongoose";
import { OTP_PURPOSES } from "../../shared/constants/index.js";

const otpChallengeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      required: true,
      enum: Object.values(OTP_PURPOSES),
    },
    destination: { type: String, required: true },
    codeHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0, min: 0 },
    maxAttempts: { type: Number, required: true, min: 1 },
    requestedIp: { type: String, default: null },
  },
  { timestamps: true, versionKey: false },
);

otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpChallengeSchema.index({ user: 1, purpose: 1, createdAt: -1 });

const OtpChallenge =
  mongoose.models.OtpChallenge ||
  mongoose.model("OtpChallenge", otpChallengeSchema);

export default OtpChallenge;
