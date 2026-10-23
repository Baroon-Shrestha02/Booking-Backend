import mongoose from "mongoose";
import { BUSINESS_VERIFICATION_STATUSES } from "../../shared/constants/index.js";
import { createPublicId } from "../../shared/utils/ids.js";

const allowedDocumentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "image/heic",
  "image/heif",
];

const privateDocumentSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    mimeType: {
      type: String,
      required: true,
      enum: allowedDocumentTypes,
    },
    bytes: {
      type: Number,
      required: true,
      min: 1,
      max: 5 * 1024 * 1024,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const businessLogoSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      trim: true,
    },
    publicUrl: {
      type: String,
      required: true,
      trim: true,
      match: /^https:\/\//,
    },
  },
  { _id: false },
);

const ownerBusinessVerificationSchema = new mongoose.Schema(
  {
    verificationId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: () => createPublicId("bvr"),
      match: /^bvr_[a-f0-9]{24}$/,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      immutable: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 160,
    },
    businessLogo: {
      type: businessLogoSchema,
      default: null,
    },
    panVatNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 5,
      maxlength: 30,
      match: /^[A-Z0-9\-/]+$/,
    },
    businessRegistrationNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 80,
      match: /^[A-Z0-9\-/.]+$/,
    },
    panVatImage: {
      type: privateDocumentSchema,
      required: true,
      select: false,
    },
    taxClearanceImage: {
      type: privateDocumentSchema,
      required: true,
      select: false,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(BUSINESS_VERIFICATION_STATUSES),
      default: BUSINESS_VERIFICATION_STATUSES.SUBMITTED,
    },
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

ownerBusinessVerificationSchema.index({ status: 1, submittedAt: 1 });

const OwnerBusinessVerification =
  mongoose.models.OwnerBusinessVerification ||
  mongoose.model("OwnerBusinessVerification", ownerBusinessVerificationSchema);

export default OwnerBusinessVerification;
