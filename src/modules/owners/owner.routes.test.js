import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";

test("business verification status requires authentication", async () => {
  const response = await request(app).get(
    "/api/v1/owners/me/business-verification",
  );

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, "unauthenticated");
});

test("business verification submission requires authentication", async () => {
  const response = await request(app)
    .post("/api/v1/owners/me/business-verification")
    .field("businessName", "KhelYard Sports Center")
    .field("panVatNumber", "123456789")
    .field("businessRegistrationNumber", "REG-2026-001");

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, "unauthenticated");
});

test("business verification update requires authentication", async () => {
  const response = await request(app)
    .patch("/api/v1/owners/me/business-verification")
    .send({ businessName: "Updated Sports Center" });

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, "unauthenticated");
});
