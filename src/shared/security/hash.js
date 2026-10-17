import { createHash, timingSafeEqual } from "node:crypto";

export const hashToken = (value) =>
  createHash("sha256").update(value).digest("hex");

export const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
};
