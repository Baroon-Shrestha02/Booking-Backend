import { randomBytes } from "node:crypto";

export const createPublicId = (prefix) => {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
};
