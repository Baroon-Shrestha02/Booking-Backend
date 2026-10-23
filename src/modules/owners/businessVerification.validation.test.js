import test from "node:test";
import assert from "node:assert/strict";
import {
  submitBusinessVerificationSchema,
  updateBusinessVerificationSchema,
} from "./businessVerification.validation.js";

test("accepts the required business-verification fields", () => {
  const result = submitBusinessVerificationSchema.body.safeParse({
    businessName: "KhelYard Sports Center",
    panVatNumber: "123456789",
    businessRegistrationNumber: "REG-2026-001",
  });

  assert.equal(result.success, true);
});

test("rejects personal or venue fields in business verification", () => {
  const result = submitBusinessVerificationSchema.body.safeParse({
    businessName: "KhelYard Sports Center",
    panVatNumber: "123456789",
    businessRegistrationNumber: "REG-2026-001",
    citizenshipNumber: "not-accepted",
  });

  assert.equal(result.success, false);
});

test("accepts a partial business-verification update", () => {
  const result = updateBusinessVerificationSchema.body.safeParse({
    businessName: "Updated Sports Center",
  });

  assert.equal(result.success, true);
  assert.deepEqual(result.data, { businessName: "Updated Sports Center" });
});

test("rejects protected fields in a business-verification update", () => {
  const result = updateBusinessVerificationSchema.body.safeParse({
    status: "approved",
  });

  assert.equal(result.success, false);
});
