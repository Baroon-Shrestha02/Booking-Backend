import { z } from "zod";

const nullableText = (maximum) =>
  z.preprocess(
    (value) => (value === "" ? null : value),
    z.string().trim().max(maximum).nullable(),
  );

const multipartSports = (value) => {
  if (typeof value !== "string") return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return [value];
  }
};

const favouriteSports = z.preprocess(
  multipartSports,
  z
    .array(z.string().trim().min(1).max(50).transform((sport) => sport.toLowerCase()))
    .max(5)
    .refine((sports) => new Set(sports).size === sports.length, {
      message: "Favourite sports must not contain duplicates",
    }),
);

export const updateProfileSchema = {
  body: z
    .object({
      name: z.string().trim().min(2).max(80).optional(),
      homeArea: nullableText(100).optional(),
      bio: nullableText(500).optional(),
      favouriteSports: favouriteSports.optional(),
    })
    .strict(),
};
