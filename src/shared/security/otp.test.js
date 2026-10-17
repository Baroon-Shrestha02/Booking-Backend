import test from "node:test";
import assert from "node:assert/strict";
import { generateOtp, hashOtp, verifyOtpHash } from "./otp.js";

test("generates six-digit OTP codes", () => {
  assert.match(generateOtp(), /^\d{6}$/);
});

test("binds an OTP hash to its user and purpose", () => {
  const expectedHash = hashOtp({
    subject: "507f1f77bcf86cd799439011",
    purpose: "registration",
    code: "123456",
  });
  assert.equal(
    verifyOtpHash({
      subject: "507f1f77bcf86cd799439011",
      purpose: "registration",
      code: "123456",
      expectedHash,
    }),
    true,
  );
  assert.equal(
    verifyOtpHash({
      subject: "507f191e810c19729de860ea",
      purpose: "registration",
      code: "123456",
      expectedHash,
    }),
    false,
  );
});
