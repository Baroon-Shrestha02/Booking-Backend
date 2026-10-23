import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { BUSINESS_VERIFICATION_STATUSES } from "../../shared/constants/index.js";
import OwnerBusinessVerification from "./ownerBusinessVerification.model.js";

const documentImage = (name) => ({
  publicId: `private/owner-verification/${name}`,
  originalName: `${name}.jpg`,
  mimeType: "image/jpeg",
  bytes: 2048,
});

const validVerification = () => ({
  owner: new mongoose.Types.ObjectId(),
  businessName: "KhelYard Sports Center",
  panVatNumber: "123456789",
  businessRegistrationNumber: "REG-2026-001",
  panVatImage: documentImage("pan-vat"),
  taxClearanceImage: documentImage("tax-clearance"),
});

test("creates a submitted business verification with a public ID", async () => {
  const verification = new OwnerBusinessVerification(validVerification());
  await verification.validate();

  assert.match(verification.verificationId, /^bvr_[a-f0-9]{24}$/);
  assert.equal(
    verification.status,
    BUSINESS_VERIFICATION_STATUSES.SUBMITTED,
  );
  assert.ok(verification.submittedAt instanceof Date);
  assert.equal(verification.businessLogo, null);
});

test("accepts an optional public business logo", async () => {
  const verification = new OwnerBusinessVerification({
    ...validVerification(),
    businessLogo: {
      publicId: "khelyard/business-logos/owner-logo",
      publicUrl:
        "https://res.cloudinary.com/example/image/upload/owner-logo.jpg",
    },
  });

  await verification.validate();
  assert.equal(
    verification.businessLogo.publicId,
    "khelyard/business-logos/owner-logo",
  );
});

test("business verification accepts only supported document images", async () => {
  const verification = new OwnerBusinessVerification({
    ...validVerification(),
    taxClearanceImage: {
      ...documentImage("tax-clearance"),
      mimeType: "application/pdf",
    },
  });

  await assert.rejects(
    verification.validate(),
    /is not a valid enum value for path `mimeType`/,
  );
});

test("business verification requires both document images", async () => {
  const data = validVerification();
  delete data.panVatImage;
  const verification = new OwnerBusinessVerification(data);

  await assert.rejects(
    verification.validate(),
    /Path `panVatImage` is required/,
  );
});
