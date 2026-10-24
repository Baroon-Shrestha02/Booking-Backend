import { z } from "zod";
import { BUSINESS_VERIFICATION_STATUSES } from "../../shared/constants/index.js";

const businessFields = {
  businessName: z.string().trim().min(2).max(160),
  panVatNumber: z
    .string()
    .trim()
    .min(5)
    .max(30)
    .regex(/^[a-zA-Z0-9\-/]+$/, "Enter a valid PAN/VAT number"),
  businessRegistrationNumber: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-zA-Z0-9\-/.]+$/, "Enter a valid business registration number"),
};

export const submitBusinessVerificationSchema = {
  body: z.object(businessFields).strict(),
};

export const updateBusinessVerificationSchema = {
  body: z.object(businessFields).partial().strict(),
};

const reviewNote = z.string().trim().min(1).max(1000);

export const reviewBusinessVerificationSchema = {
  params: z
    .object({
      verificationId: z
        .string()
        .regex(/^bvr_[a-f0-9]{24}$/, "Enter a valid verification ID"),
    })
    .strict(),
  body: z.discriminatedUnion("status", [
    z
      .object({
        status: z.literal(BUSINESS_VERIFICATION_STATUSES.APPROVED),
        reviewNotes: reviewNote.optional(),
      })
      .strict(),
    z
      .object({
        status: z.literal(BUSINESS_VERIFICATION_STATUSES.REJECTED),
        reviewNotes: reviewNote,
      })
      .strict(),
  ]),
};
