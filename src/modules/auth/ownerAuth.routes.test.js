import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";

test("owner registration uses the same ten-digit phone rule", async () => {
  const response = await request(app).post("/api/v1/owner-auth/register").send({
    name: "Test Owner",
    email: "owner@example.com",
    phone: "+9779818738923",
    password: "strong-password",
  });

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, "validation_failed");
  assert.equal(response.body.error.details.issues[0].path, "phone");
});

test("owner OTP verification requires email and code", async () => {
  const response = await request(app)
    .post("/api/v1/owner-auth/verify-registration")
    .send({ code: "123456" });

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, "validation_failed");
});
