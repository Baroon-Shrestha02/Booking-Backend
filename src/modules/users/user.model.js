import mongoose from "mongoose";
import { USER_ROLES, USER_STATUSES } from "../../shared/constants/index.js";

const playerStatsSchema = new mongoose.Schema(
  {
    gamesPlayed: { type: Number, default: 0, min: 0 },
    gamesHosted: { type: Number, default: 0, min: 0 },
    goalsScored: { type: Number, default: 0, min: 0 },
    bookingsCompleted: { type: Number, default: 0, min: 0 },
    hoursPlayed: { type: Number, default: 0, min: 0 },
    winRate: { type: Number, default: 0, min: 0, max: 1 },
    favouriteSportIndex: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const profileImageSchema = new mongoose.Schema(
  {
    publicId: { type: String, trim: true, default: null },
    publicUrl: { type: String, trim: true, default: "default-profile.png" },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
      match: /^(97|98)\d{8}$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: { type: String, required: true, select: false },
    passwordChangedAt: { type: Date, default: null },
    role: {
      type: String,
      required: true,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.PLAYER,
      immutable: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(USER_STATUSES),
      default: USER_STATUSES.ACTIVE,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    profileImage: { type: profileImageSchema, default: () => ({}) },
    homeArea: { type: String, trim: true, default: null },
    bio: { type: String, trim: true, default: null },
    favouriteSportIndices: { type: [Number], default: [] },
    stats: { type: playerStatsSchema, default: () => ({}) },
    creditsBalance: { type: Number, default: 0, min: 0 },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_document, value) {
        delete value.passwordHash;
        return value;
      },
    },
  },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
