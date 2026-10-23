import { z } from "zod";

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
    .regex(
      /^[a-zA-Z0-9\-/.]+$/,
      "Enter a valid business registration number",
    ),
};

export const submitBusinessVerificationSchema = {
  body: z
    .object(businessFields)
    .strict(),
};

export const updateBusinessVerificationSchema = {
  body: z.object(businessFields).partial().strict(),
};
