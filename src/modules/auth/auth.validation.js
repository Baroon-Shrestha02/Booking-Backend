import { z } from "zod";

const phone = z
  .string()
  .regex(/^(97|98)\d{8}$/, "Use exactly 10 digits without +977");
const email = z.string().trim().email().max(254);
const password = z
  .string()
  .min(8, "Password must contain at least 8 characters")
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Password must not exceed 72 UTF-8 bytes",
  );

export const registerSchema = {
  body: z
    .object({
      name: z.string().trim().min(2).max(80),
      email,
      phone,
      password,
    })
    .strict(),
};

export const verifyRegistrationSchema = {
  body: z
    .object({
      email,
      code: z.string().regex(/^\d{6}$/, "Code must contain exactly six digits"),
    })
    .strict(),
};

export const resendRegistrationOtpSchema = {
  body: z.object({ email }).strict(),
};

export const loginSchema = {
  body: z.object({ email, password }).strict(),
};

export const refreshSchema = {
  body: z.object({ refreshToken: z.string().min(1) }).strict(),
};

export const changePasswordSchema = {
  body: z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: password,
    })
    .strict()
    .refine(
      ({ currentPassword, newPassword }) => currentPassword !== newPassword,
      {
        path: ["newPassword"],
        message: "New password must be different from the current password",
      },
    ),
};

export const forgotPasswordSchema = {
  body: z.object({ email }).strict(),
};

export const resetPasswordSchema = {
  body: z
    .object({
      email,
      code: z.string().regex(/^\d{6}$/, "Code must contain exactly six digits"),
      newPassword: password,
    })
    .strict(),
};
