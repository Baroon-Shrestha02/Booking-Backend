import test from "node:test";
import assert from "node:assert/strict";
import { reviewBusinessVerificationSchema } from "./businessVerification.validation.js";

const validParams = { verificationId: "bvr_0123456789abcdef01234567" };

test("admin can approve a submitted business verification", () => {
  assert.equal(
    reviewBusinessVerificationSchema.body.safeParse({ status: "approved" })
      .success,
    true,
  );
  assert.equal(
    reviewBusinessVerificationSchema.params.safeParse(validParams).success,
    true,
  );
});

test("admin rejection requires review notes", () => {
  assert.equal(
    reviewBusinessVerificationSchema.body.safeParse({ status: "rejected" })
      .success,
    false,
  );
  assert.equal(
    reviewBusinessVerificationSchema.body.safeParse({
      status: "rejected",
      reviewNotes: "Tax-clearance document has expired.",
    }).success,
    true,
  );
});

test("admin cannot set an intermediate or arbitrary review status", () => {
  assert.equal(
    reviewBusinessVerificationSchema.body.safeParse({
      status: "under_review",
    }).success,
    false,
  );
});
